var apiUrl = "https://api.vk.com/method/";
var accessToken = null;
var groupsList = null;


$(document).ready(function()
{
	getToken();
	api("groups.get","extended=1&filter=admin", function(response)
	{
		groupsList = response["response"].slice(1);
		for(var i = 0; i < groupsList.length; i++)
		{
			var name = groupsList[i]["name"];
			var gid = groupsList[i]["gid"];
			$("#groupsSelect").append(new Option(name, gid) );
		}
		
	})
})

//retrieve token from server
function getToken()
{
	$.ajax({
		url: '/token_sender.php',
		async: false,
		success: function(response)
		{
			accessToken = response;
		}
	});
}

//execute api call
function api(method, parameters, callback)
{
	if(accessToken === null)
	{
		getToken();
	}
	var apiRequest = apiUrl + method + '?' + parameters + '&access_token=' + accessToken;
	$.ajax({
		url: apiRequest,
		dataType: 'jsonp',
		success: function(response)
		{
			callback(response);	
			return response;
		},
		error: function (response) {
			console.log(response);
		}
	});
}

//api call that sends post to group wall
function sendPost(postText, groupId, fromGroup)
{
	var parameters = "owner_id=" + groupId + "&from_group=" + fromGroup + "&message=" + postText;
	api("wall.post", parameters, function(response)
	{
		console.log(response);
	});
}

function getPosts(groupId, count, offset, callback)
{
	var parameters = "owner_id=-" + groupId + "count=" + count + "offset=" + offset + "extended=1";
	api("wall.get", parameters, callback);
}

function getComments(groupId, postId, count, offset, callback)
{
	var parameters = "owner_id=-" + groupId + "postId=" + postId + "count=" + count + "offset=" + offset + "extended=1";
}


$("#postButton").click(function()
{
	var group = $("#groupsSelect :selected").val();
	var fromGroup = $("#fromGroupCheckBox").prop("checked") ? 1 : 0;
	var message = $("#postText").val();
	if(group === "All")
	{
		for(var i = 0; i < groupsList.length; i++)
		{
			var gid = "-"+groupsList[i]["gid"];
			sendPost(message, gid, fromGroup);
		}		
	}
	else
	{
		sendPost(message, "-" + group, fromGroup);
	}
})

