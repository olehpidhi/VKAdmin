var app = angular.module("VKAdmin",[]);
function StatisticsController($scope)
{

}

function PostingController($scope)
{
	$scope.init = VK.api("groups.get", {
		extended:1,
		filter:"admin"
	}, 
	function(response)	
	{
		$scope.groups = response.response.slice(1);
		$scope.$apply();
	});

	$scope.uploadPhoto = function()
	{
		VK.api("photos.getWallUploadServer",
		{
			gid:$("#groups-select :selected").val()
		},
		function(response)
		{
			
		}
		);
	}
	$scope.post = function()
	{
		function sendPost(postText, groupId, fromGroup)
		{
			VK.api("wall.post",
			{
				owner_id: groupId,
				from_group: fromGroup,
				message: postText
			}, function(response)			
			{
				console.log(response);
			});
		}

		var group = $("#groups-select :selected").val();
		if(group === "All")
		{
			for(var i = 0; i < $scope.groups.length; ++i)
			{
				console.log($scope.groups[i]);
				console.log($scope.groups[i].gid);
				sendPost($scope.postText, -$scope.groups[i].gid, $scope.fromGroup ? 1 : 0);
			}
		}
		else
		{
			sendPost($scope.postText, -group, $scope.fromGroup ? 1 : 0);
		}
	}
}

function WallController($scope)
{
	$scope.postsOffset = 0;
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
				$scope.posts = response.response.wall.slice(1);
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
		}
		)
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
		VK.api("wall.getComments",
		{
			v: 5.27,
			owner_id:-$("#groups-select :selected").val(),
			post_id: postId,
			offset:0,
			count: 100,
			extended: 1
		},
		function(response)
		{
			console.log(response);
			$scope.comments[$index] = response.response.items;
			// $scope.comments[$index].forEach(function(obj)
			// 	{
			// 		obj.user = response.response.profiles.filter(function(obj1)
			// 		{
			// 			return obj1.id === obj.from_id;
			// 		})[0];
			// 	});
			// $scope.profiles = response.response.profiles;
			// $scope.groups = response.response.groups;
			$scope.$apply();

		})
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

	$scope.beginReply = function(commentId)
	{
		$("#commentText").focus();
		$scope.replyTo = commentId;
	}

}
