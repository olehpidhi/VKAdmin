var app = angular.module("VKAdmin",["angularFileUpload", "ngCookies"]);


function StatisticsController($scope) {

}

app.factory("CurrentGroupProvider", function() {
    var currentGroupWrapper = {group : null};
    return currentGroupWrapper;
});

app.factory("ErrorMessageProvider", function() {
    return {message: ''};
});

app.controller("PostingController",['$scope', '$http', '$cookies', 'FileUploader', 'CurrentGroupProvider', 'ErrorMessageProvider', 
    function ($scope, $http ,$cookies, FileUploader, CurrentGroupProvider, ErrorMessageProvider) {


        $scope.error = ErrorMessageProvider;
        $scope.uploadStarted = false;
        $scope.uploadFinished = false;

        $scope.videos = [];

        $scope.groups = [{name:"All"}];
        $scope.currentGroup = CurrentGroupProvider;
        var uploader = $scope.uploader = new FileUploader({url:"upload_file.php"});

        //Init func. Gets list of groups that you can administrate
        $scope.init = VK.api("groups.get", {            
            extended:1,
            filter:"admin"
        }, function(response) {
            $scope.groups = $scope.groups.concat(response.response.slice(1));
            $scope.$apply();
        });



        uploader.filters.push({
            name: 'customFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                return this.queue.length < 10;
            }
        });

        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            VK.api("photos.saveWallPhoto",
            {
                group_id: $scope.currentGroup.group.gid,
                photo: response.photo,
                hash: response.hash,
                server: response.server
            }, function(response) {
                $scope.attachment.push(response.response[0]);
                $scope.uploadFinished = true;
                $scope.uploadStarted = false;
            });
        };

        uploader.onErrorItem = function(item, response, status, headers) {
            $scope.error.message = response.error;
        };

        uploader.onAfterAddingAll = function(item) {
            $scope.uploadStarted = true;
            console.info('onBeforeUploadItem', item);
        };

        $scope.uploadVideo = function() {
            if($scope.youtubeUrl) {
                var groupId = $scope.currentGroup.group.name === "All" ? $scope.groups[1].gid : $scope.currentGroup.group.gid;
                VK.api("video.save",
                {
                    group_id: groupId,
                    link: $scope.youtubeUrl,
                    name: $scope.youtubeName === "" ? null : $scope.youtubeName,
                    description: $scope.youtubeDescription === "" ? null : $scope.youtubeDescription
                }, 
                function(response) {
                    $http.post(response.response.upload_url);
                    $scope.videos.push(response.response);
                });
            } else {

            }
        };

        $scope.deleteVideo = function(index) {
            $scope.videos.splice(index,1);
        }

        $scope.resolveUploadURL = function() {
          VK.api("photos.getWallUploadServer", {
            gid: $scope.currentGroup.group.gid
        }, function(response) {
            $cookies.upload_url = response.response.upload_url; 
        });   
      }
//Posts to single or all groups according to currentGroup value
$scope.post = function() {
    function createAttachments() {
        var attachments = "";
        if($scope.videos)
        {
            for(var i = 0; i < $scope.videos.length; ++i) {
                attachments += ("video" + $scope.videos[i].owner_id + '_' + $scope.videos[i].vid + ',');
            }
        }

        return attachments;
    }
    //Posts message to single group
    function sendPost(postText, groupId, fromGroup) {
        VK.api("wall.post", {
            owner_id: groupId,
            from_group: fromGroup,
            message: postText,
            attachments: createAttachments()
        }, function(response)			
        {
            if(response.error) {
                $scope.error.message = response.error.error_msg;
                $scope.$apply();
            } else {
                $scope.error.message = "Succesfully posted";
                $scope.$apply();
            }
        });
    }

    if($scope.currentGroup.group.name === "All") {
        for(var i = 1; i < $scope.groups.length; ++i) {
            sendPost($scope.postText, -$scope.groups[i].gid, $scope.fromGroup ? 1 : 0);
        }
    } else {
        sendPost($scope.postText, -$scope.currentGroup.group.gid, $scope.fromGroup ? 1 : 0);
    }
}

}]);

app.controller("WallController",['$scope', 'CurrentGroupProvider', 'ErrorMessageProvider',
    function ($scope, CurrentGroupProvider, ErrorMessageProvider) {

    $scope.currentGroup = CurrentGroupProvider;
    $scope.error = ErrorMessageProvider;
    $scope.postsOffset = 0;
    $scope.commentsOffset = 0;
    $scope.editing = [0];
    $scope.backup = [];
    $scope.deleted = [0];
    $scope.commentsShow = [0];
    $scope.comments = [];
    $scope.replyTo = 0;

    //
    $scope.getPosts = function() {
        var group = $scope.currentGroup.group;
        if(group != null) {
            if(group.name === "All") {
                $scope.error.message = "Please, select single group to fetch posts from.";
            } else {
                //make API call
                VK.api("wall.get", {
                    owner_id: -group.gid,
                    offset: $scope.postsOffset,
                    count: 100,
                    extended: 1
                },
                //callback binds retrived data to view
                 function(response) {
                    //check if we retrieved some posts previously
                    if(typeof $scope.posts === "undefined") {
                        $scope.posts = response.response.wall.slice(1);
                    } else {
                        $scope.posts.concat(response.response.wall.slice(1));	
                    }
                    //increase offset to have ability to retrieve next posts later
                    $scope.postsOffset += 100;
                    //for each post add it's owner(group) as member of post object
                    $scope.posts.forEach(function(obj) {
                        obj.comments = null;
                        obj.owner = response.response.groups.filter(function(obj1) {
                            if(Math.abs(obj.from_id) === obj1.gid) {
                                obj.isFromGroup = true;
                                return true;
                            }
                            return false;
                        })[0];
                    });
                    //for each post add it's owner(user) as member of post object
                    $scope.posts.forEach(function(obj) {
                        if(typeof obj.owner === "undefined") {
                            obj.owner = response.response.profiles.filter(function(obj1) {
                                if(!obj.isFromGroup && obj.from_id === obj1.uid) {
                                    return true;
                                }
                                return false;
                            })[0];
                        }
                    });
                    $scope.$apply();
                });
            }
        } else {
            $scope.error.message = "Please, select single groups to fetch posts form";
        }
    }

    $scope.beginEdit = function(index) {
        $scope.posts[index].editing = true;
        $scope.posts[index].backup = $scope.posts[index].text;
    }

    $scope.cancelEdit = function(index) {
        $scope.posts[index].editing = false;
        $scope.posts[index].text = $scope.posts[index].backup;
    }

    $scope.editPost = function(message, index) {
        VK.api("wall.edit", {
            owner_id: -$scope.currentGroup.group.gid,
            post_id: $scope.posts[index].id,
            message: message
        }, function(response) {
            console.log(response);
        });
        $scope.posts[index].editing = false;
    }

    $scope.deletePost = function(index) {
        $scope.posts[index].deleted = true;
        VK.api("wall.delete", {
            owner_id: -$scope.currentGroup.group.gid,
            post_id: $scope.posts[index].id
        }, function(response) {
        });
    }

    $scope.restorePost = function(index) {
        $scope.posts[index].deleted = false;
        VK.api("wall.restore", {
            owner_id: -$scope.currentGroup.group.gid,
            post_id: $scope.posts[index].id
        }, function(response) {

        });
    }

    $scope.getComments = function(index) {
        //show comments section
        $scope.posts[index].commentsShow = true;
        //check if we haven't already retrieved comments for this post
        if(($scope.posts[index].comments === null) ? 1 : ($scope.posts[index].comments.length === 0)) {
            //Make API call to retrieve comments for 
            VK.api("wall.getComments", {
                v: 5.27,
                owner_id: -$scope.currentGroup.group.gid,
                post_id: $scope.posts[index].id,
                offset: $scope.posts[index].commentsOffset,
                count: 100,
                extended: 1
            }, 
            //callback that binds comments data to view
            function(response) {
                console.log(response);

                //check if we haven't retrieved this comments earlier
                if($scope.posts[index].comments === null) {
                    $scope.posts[index].comments = response.response.items;
                } else {
                    //if comments was already retrieved than add next to exsisting
                    $scope.posts[index].comments.concat(response.response.items);	
                }

                //add comment owner to each comment as its member(for group comments)
                $scope.posts[index].comments.forEach(function(obj) 
                {
                    obj.owner = response.response.groups.filter(function(obj1){
                        if(Math.abs(obj.from_id) === obj1.id){
                            obj.isFromGroup = true;
                            return true;
                        }
                        return false;
                    })[0];
                });
                //add comment owner to each comment as its member(for user comments)
                $scope.posts[index].comments.forEach(function(obj) {
                    if(typeof obj.owner === "undefined")
                    {
                        obj.owner = response.response.profiles.filter(function(obj1)
                        {
                            if(!obj.isFromGroup && obj.from_id === obj1.id)
                            {
                                return true;
                            }
                            return false;
                        })[0];
                    }
                });
                $scope.$apply();});
    }
    }

    $scope.hideComments = function(index) {
        $scope.posts[index].commentsShow = false;
    }



    $scope.addComment = function(index, commentFromGroup, commentText, replyTo) {
        VK.api("wall.addComment",
        {
            owner_id: -$scope.currentGroup.group.gid,
            post_id: $scope.posts[index].id,
            from_group: commentFromGroup,
            text: commentText,
            reply_to_comment: replyTo

        },
        function(response)
        {
            console.log(response);
        }
        );
    }

    $scope.deleteComment = function(commentId, parentIndex, index) {
        $scope.comments[parentIndex][index].deleted = true;
        VK.api("wall.deleteComment",
        {
            owner_id: -$("#groups-select :selected").val(),
            comment_id: commentId
        },
        function(response)
        {

        }
        );
    }

    $scope.restoreComment = function(commentId, parentIndex ,index) {
        $scope.comments[parentIndex][index].deleted = false;
        VK.api("wall.restoreComment",
        {
            owner_id: -$("#groups-select :selected").val(),
            comment_id: commentId
        },
        function(response)
        {

        }
        );
    }

    $scope.beginEditComment = function(parentIndex, index) {
        $scope.comments[parentIndex][index].editing = true;
        $scope.comments[parentIndex][index].backup = $scope.comments[parentIndex][index].text;
    }

    $scope.editComment = function(commentId, commentText, parentIndex, index) {
        $scope.comments[parentIndex][index].editing = false;
        VK.api("wall.editComment",
        {
            owner_id: -$("#groups-select :selected").val(),
            comment_id: commentId,
            message: commentText
        },
        function(response)
        {
            console.log(response);
        });
    }

    $scope.cancelEdit = function(parentIndex, index) {	
        $scope.comments[parentIndex][index].editing = false;
        $scope.comments[parentIndex][index].text = $scope.comments[parentIndex][index].backup;
        $scope.comments[parentIndex][index].backup = null; 
    }

    $scope.beginReply = function(commentId, parentIndex) {
        $("#commentText"+parentIndex).focus();
        $scope.replyTo = commentId;
    }

}]);
