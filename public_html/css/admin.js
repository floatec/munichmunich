var URL_story="/story/all"
var URL_story_basic="/story/"

/**
 * Created by floatec on 05/12/15.
 */
$.ajax(URL_story, {
    success: function(data) {
        console.log(data)
        for(i in data){
            var akt=""
            if(data[i].active==0){
                akt="<a class='btn btn-success' onClick='activateStory("+data[i].id+");$(this).hide()'>activate</a>";
            }
            $('#list table').append("<tr><td>"+data[i].title+'<br><a class="btn btn-primary" onclick="$(this).next().toggle();$(body).addClass(\'gray\')">show story'+"</a>" +
                "<div style='display:none;position: fixed;top:0%;left: 0%;right:0%;bottom:0%;overflow-y: scroll;background: white'><a onclick='$(this).parent().hide();$(body).removeClass(\"gray\")' class='btn btn-danger'>x</a><br>' "+data[i].story+"</div>" +
                "</td><td><div style='height: 200px;width: 300px; background: url(\""+data[i].picture+"\");background-size: cover;background-position: center'></div></td><td>"+akt+"</td></tr>");
        }
    },
    error: function() {
        $('#notification-bar').text('An error occurred');
    }
});

function activateStory(id){
    $.ajax(URL_story_basic+id+"/activate/1", {
        success: function(data) {
            $('#notification-bar').text('Activated');
        },
        error: function() {
            $('#notification-bar').text('An error occurred');
        }
    });
}
