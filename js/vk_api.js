var apiUrl = "https://api.vk.com/method/";
var accessToken = null;

function getToken()
{
	$.ajax({
		url: '/token_sender.php',
		success: function(response)
		{
			accessToken = response;
			alert(accessToken);
		}
	});
}

function api(method, parameters, callback)
{
	if(accessToken === null)
	{
		getToken();
	}
	
	$.ajax({
		url: apiUrl + method + '?' + parameters + '&access_token=' + accessToken,
		success: callback
	});
}

$(document).ready(function()
{
	getToken();
})