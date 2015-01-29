var app = angular.module("VKAdmin",["angularFileUpload", "ngCookies"]);


function StatisticsController($scope)
{

}

function PostingController($scope, $http ,$cookies, FileUploader)
{
	$scope.uploadStarted = false;
	$scope.uploadFinished = false;
	$scope.attachment;
	$scope.videos = [];
	var uploader = $scope.uploader = new FileUploader({url:"upload_file.php"});

	uploader.filters.push({
		name: 'customFilter',
		fn: function(item /*{File|FileLikeObject}*/, options) {
			return this.queue.length < 10;
		}
	});

	uploader.onSuccessItem = function(fileItem, response, status, headers) {
		VK.api("photos.saveWallPhoto",
		{
			group_id: $("#groups-select :selected").val(),
			photo: response.photo,
			hash: response.hash,
			server: response.server
		}, function(response)
		{
			console.log(response);
			$scope.attachment = response.response[0];
			$scope.uploadFinished = true;
			$scope.uploadStarted = false;
		});
	};

	uploader.onErrorItem = function(item, response, status, headers) {
		console.log(response);
	};

	uploader.onBeforeUploadItem = function(item) {
		$scope.uploadStarted = true;
		console.info('onBeforeUploadItem', item);
	};

	$scope.init = VK.api("groups.get", {
		extended:1,
		filter:"admin"
	}, 
	function(response)	
	{
		$scope.groups = response.response.slice(1);
		$scope.$apply();
	});

	$scope.uploadVideo = function()
	{
		if($scope.youtubeUrl) {
			VK.api("video.save",
			{
				group_id: $("#groups-select :selected").val(),
				link: $scope.youtubeUrl,
				name: $scope.youtubeName,
				description: $scope.youtubeDescription
			}, 
			function(response) {

				$scope.videos.push("video" + response.response.owner_id + "_" + response.response.vid);
			});
		} else {

		}
	}

	$scope.resolveUploadURL = function()
	{
		VK.api("photos.getWallUploadServer",
		{
			gid:$("#groups-select :selected").val()
		},
		function(response)
		{
			// $scope.uploader.url = response.response.upload_url;	
			$cookies.upload_url = response.response.upload_url;	
		});
	}
	$scope.post = function()
	{
		function sendPost(postText, groupId, fromGroup, attachment)
		{
			if($scope.uploadFinished) {
				VK.api("wall.post",
				{
					owner_id: groupId,
					from_group: fromGroup,
					message: postText,
					attachments: attachment
				}, function(response)			
				{
					console.log(response);
				});
			} else {
				$scope.message = "Please wait, file is uploading";
			}
		}

		var group = $("#groups-select :selected").val();
		if(group === "All")
		{
			for(var i = 0; i < $scope.groups.length; ++i)
			{
				console.log($scope.groups[i]);
				console.log($scope.groups[i].gid);
				sendPost($scope.postText, -$scope.groups[i].gid, $scope.fromGroup ? 1 : 0, $scope.attachment.id);
			}
		}
		else
		{
			sendPost($scope.postText, -group, $scope.fromGroup ? 1 : 0, $scope.attachment.id);
		}
	}
}

function WallController($scope)
{
	$scope.postsOffset = 0;
	$scope.commentsOffset = 0;
	$scope.editing = [0];
	$scope.backup = [];
	$scope.deleted = [0];
	$scope.commentsShow = [0];
	$scope.comments = [];
	$scope.replyTo = 0;
	$scope.getPosts = function()
	{
		var group = $("#groups-select :selected").val();
		if(group === "All")
		{
			$scope.message = "Please, select single group to fetch posts from.";
		}
		else {
			VK.api("wall.get",
			{
				owner_id: -group,
				offset: $scope.postsOffset,
				count: 100,
				extended:1
			}, function(response)
			{
				if(typeof $scope.posts === "undefined"){
					$scope.posts = response.response.wall.slice(1);
				}
				else{
					$scope.posts.concat(response.response.wall.slice(1));	
				}
				
				$scope.postsOffset += 100;
				$scope.posts.forEach(function(obj) {
					obj.owner = response.response.groups.filter(function(obj1){
						if(Math.abs(obj.from_id) === obj1.gid){
							obj.isFromGroup = true;
							return true;
						}
						return false;
					})[0];
				});
				$scope.posts.forEach(function(obj) {
					if(typeof obj.owner === "undefined"){
						obj.owner = response.response.profiles.filter(function(obj1){
							if(!obj.isFromGroup && obj.from_id === obj1.uid)
							{
								return true;
							}
							return false;
						})[0];
					}
				});
				$scope.$apply();
			});
		}
	}

	$scope.beginEdit = function($index)
	{
		$scope.editing[$index] = true;
		$scope.backup[$index] = $scope.posts[$index].text;
	}

	$scope.cancelEdit = function($index)
	{
		$scope.editing[$index] = false;
		$scope.posts[$index].text = $scope.backup[$index];
	}

	$scope.editPost = function(postId, message, $index)
	{
		VK.api("wall.edit",
		{
			owner_id: -$("#groups-select :selected").val(),
			post_id: postId,
			message: message
		},
		function(response)
		{
			console.log(response);
		});
		$scope.editing[$index] = false;
	}

	$scope.deletePost = function(postId, $index)
	{
		$scope.deleted[$index] = true;
		VK.api("wall.delete",
		{
			owner_id: -$("#groups-select :selected").val(),
			post_id: postId
		},
		function(response)
		{
		});
	}

	$scope.restorePost = function(postId, $index)
	{
		$scope.deleted[$index] = false;
		VK.api("wall.restore",
		{
			owner_id: -$("#groups-select :selected").val(),
			post_id: postId
		},
		function(response)
		{			
		}
		)
	}

	$scope.getComments = function(postId, $index)
	{
		$scope.commentsShow[$index] = true;
		if((typeof $scope.comments[$index] === "undefined") ? 1 : ($scope.comments[$index].length ==0))
		{
			VK.api("wall.getComments",
			{
				v: 5.27,
				owner_id:-$("#groups-select :selected").val(),
				post_id: postId,
				offset: $scope.commentsOffset[$index],
				count: 100,
				extended: 1
			},
			function(response)
			{
				$scope.commentsOffset += 100;
				console.log(response);
				if(typeof $scope.comments[$index] === "undefined")
				{
					$scope.comments[$index] = response.response.items;
				}
				else 
				{
					$scope.comments[$index].concat(response.response.items);	
				}			
				$scope.comments[$index].forEach(function(obj) 
				{
					obj.owner = response.response.groups.filter(function(obj1){
						if(Math.abs(obj.from_id) === obj1.id){
							obj.isFromGroup = true;
							return true;
						}
						return false;
					})[0];
				});
				$scope.comments[$index].forEach(function(obj) {
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
$scope.hideComments = function(index)
{
	$scope.commentsShow[index] = false;
}

}



$scope.addComment = function(postId, commentFromGroup, commentText, replyTo)
{
	VK.api("wall.addComment",
	{
		owner_id: -$("#groups-select :selected").val(),
		post_id: postId,
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
$scope.deleteComment = function(commentId, parentIndex, index)
{
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
$scope.restoreComment = function(commentId, parentIndex ,index)
{
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
$scope.beginEditComment = function(parentIndex, index)
{
	$scope.comments[parentIndex][index].editing = true;
	$scope.comments[parentIndex][index].backup = $scope.comments[parentIndex][index].text;
}
$scope.editComment = function(commentId, commentText, parentIndex, index)
{
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
$scope.cancelEdit = function(parentIndex, index)
{	
	$scope.comments[parentIndex][index].editing = false;
	$scope.comments[parentIndex][index].text = $scope.comments[parentIndex][index].backup;
	$scope.comments[parentIndex][index].backup = null; 
}

$scope.beginReply = function(commentId, parentIndex)
{
	$("#commentText"+parentIndex).focus();
	$scope.replyTo = commentId;
}

}
