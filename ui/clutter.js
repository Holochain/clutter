Clutter =
{ "debug": true,

  "functionSpecDict":
      { "appProperty":{"preSendHook":"Clutter.noOp=true;","successPreResult":"Clutter.noOp=true;","successPostResult":"Clutter.noOp=true;"},
        "getPostsBy":{"preSendHook":"Clutter.noOp=true;","successPreResult":"Clutter.noOp=true;","successPostResult":"Clutter.noOp=true;"},
        "getHandles":{"preSendHook":"Clutter.noOp=true;","successPreResult":"Clutter.noOp=true;","successPostResult":"Clutter.noOp=true;"},
        "newHandle":{"preSendHook":"$(\".spinner\").toggleClass(\"show\", true);","successPreResult":"Clutter.noOp=true;","successPostResult":"$(\".spinner\").toggleClass(\"show\", false);"},
        "getAgent":{"preSendHook":"$(\".spinner\").toggleClass(\"show\", true);","successPreResult":"Clutter.noOp=true;","successPostResult":"Clutter.noOp=true;"},
        "follow":{"preSendHook":"$(\".spinner\").toggleClass(\"show\", true);","successPreResult":"Clutter.noOp=true;","successPostResult":"$(\".spinner\").toggleClass(\"show\", false);"},
        "unfollow":{"preSendHook":"$(\".spinner\").toggleClass(\"show\", true);","successPreResult":"Clutter.noOp=true;","successPostResult":"$(\".spinner\").toggleClass(\"show\", false);"},
        "post":{"preSendHook":"$(\".logo > img\").toggleClass(\"spin\", true);","successPreResult":"Clutter.noOp=true;","successPostResult":"$(\".logo > img\").toggleClass(\"spin\", false);"},
        "manual":{"clearUI":"$(\".spinner\").toggleClass(\"show\", false);","normalUI":"$(\".spinner\").toggleClass(\"show\", false);"},
        "getHandle":{"preSendHook":"$(\"#changeHandleButton\").toggleClass(\"colorCycle\", true);","successPreResult":"Clutter.noOp=true;","successPostResult":"$(\"#changeHandleButton\").toggleClass(\"colorCycle\", false);"},
        "getFollow":{"preSendHook":"$('#followButton').toggleClass('colorCycle', true);","successPreResult":"Clutter.noOp=true;","successPostResult":"$('#followButton').toggleClass('colorCycle', false);"}
      },
  "getHook":
      (functionName, hookName) =>
      { if (!Clutter.functionSpecDict.hasOwnProperty(functionName))
        { Clutter.functionSpecDict[functionName]  = {};
        }
        if (!Clutter.functionSpecDict[functionName].hasOwnProperty(hookName))
        { Clutter.functionSpecDict[functionName][hookName] = "";
        }
        return Clutter.functionSpecDict[functionName][hookName];
      },
};
console.log("type 'Clutter.debug=true' into the console to see messages back and forth to the server. 'Clutter.debug=false' to stop");

var App = {posts:{},users:{},handles:{},follows:{},handle:"",me:""};

function getHandle(who,callbackFn) {
    send("getHandle",who,function(handle) {
        cacheUser({handle:handle,hash:who});
        if (callbackFn!=undefined) {
            callbackFn(who,handle);
        }
    });
}

function getHandles(callbackFn) {
    send("getHandles","",function(handles) {
        handles = JSON.parse(handles);
        var keys = Object.keys(handles);
        var len = keys.length;
        if (Clutter.debug) console.log(JSON.stringify(handles));
        for (var i = 0; i < len; i++) {
            var k = keys[i];
            cacheUser({handle:handles[k],hash:k});
        }
        if (callbackFn!=undefined) {
            callbackFn();
        }
    });
}

function getMyHandle(callbackFn) {
    getHandle(App.me,function(hash,handle){
        if (handle != "") {
          App.handle = handle;
          $("#handle").html(handle);
          if (callbackFn!=undefined) {
              callbackFn();
          }
        } else {
          openSetHandle();
        }
    });
}

function getFollow(who,type,callbackFn) {
    send("getFollow",JSON.stringify({from:who,type:type}),function(data) {
        var j =  JSON.parse(data);
        var following = j.result;
        if (following != undefined) {
            var len = following.length;
            for (var i = 0; i < len; i++) {
                cacheFollow(following[i]);
            }
            if (callbackFn!=undefined) {
                callbackFn(following);
            }
        }
    });
}

function getProfile() {
    send("appProperty","App_Key_Hash", function(me) {
        App.me = me;
        getMyHandle();
        getFollow(me,"listening_to",getMyFeed);
    });
}

function addPost() {
    var now = new(Date);
    var post = {
        message:$('#meow').val(),
        stamp: now.valueOf()
    };
    message:$('#meow').val('');
    send("post",JSON.stringify(post),function(data) {
        post.key = JSON.parse(data); // save the key of our post to the post
        post.author = App.me;
        var id = cachePost(post);
        $("#meows").prepend(makePostHTML(id,post,App.handle));
    });
}

function doEditPost() {
    var now = new(Date);
    var id = $('#postID').val();
    var post = {
        message:$('#editedMessage').val(),
        stamp: now.valueOf()
    };
    $('#editPostDialog').modal('hide');
    send("postMod",JSON.stringify({hash:App.posts[id].key,post:post}),function(data) {
        post.key = JSON.parse(data); // save the key of our post to the post
        post.author = App.me;
        $("#"+id).remove();
        id = cachePost(post);
        $("#meows").prepend(makePostHTML(id,post,App.handle));
    });
}

function follow(hash,fn) {
    send("follow",hash,function(data) {
        cacheFollow(hash);
        if (fn!=undefined) {
            fn();
        }
    });
}

function unfollow(hash,fn) {
    send("unfollow",hash,function(data) {
        uncacheFollow(hash);
        if (fn!=undefined) {
            fn();
        }
    });
}

function getUserHandle(user) {
    var author = App.handles[user];
    var handle;
    if (author == undefined) {
        handle = user;
    } else {
        handle = author.handle;
    }
    return handle;
}

function makePostHTML(id,post) {
    var d = new Date(post.stamp);
    var handle = getUserHandle(post.author);
    return '<div class="meow" id="'+id+'"><a class="meow-edit" href="#" onclick="openEditPost('+id+')">edit</a><div class="stamp">'+d+'</div><a href="#" class="user" onclick="showUser(\''+post.author+'\');">@'+handle+'</a><div class="message">'+post.message+'</div></div>';
}

function makeUserHTML(user) {
    return '<div class="user">'+user.handle+'</div>';
}

function makeResultHTML(result) {
    var id;
    return '<div class="search-result" id="'+id+'"><div class="user">'+result.handle+'</div></div>';
}

function getUserPosts(user) {
    getPosts([user]);
}

function getMyFeed() {
    var users = Object.keys(App.follows);
    if (!users.includes(App.me)) {
        users.push(App.me);
    }
    getPosts(users);
}

function getPosts(by) {

    // check to see if we have the author's handles
    for (var i=0;i<by.length;i++) {
        var author = by[i];
        var handle = App.handles[author];
        if (handle == undefined) {
            getHandle(author);
        }
    }
    send("getPostsBy",JSON.stringify(by),function(arr) {
        arr = JSON.parse(arr);
        if (Clutter.debug) console.log("posts: " + JSON.stringify(arr));

        var len = len = arr.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                var post = arr[i].post;
                post.author = arr[i].author;
                var id = cachePost(post);
            }
        }
        displayPosts();
    },
    true);
}

function cachePost(p) {
    if (Clutter.debug) console.log("caching post:"+JSON.stringify(p));
    var id = p.stamp;
    App.posts[id] = p;
    return id;
}

function cacheUser(u) {
    if (Clutter.debug) console.log("caching user:",JSON.stringify(u));
    App.users[u.handle] = u;
    App.handles[u.hash] = u;
}

function cacheFollow(f) {
    App.follows[f] = true;
}

function uncacheFollow(f) {
    delete App.follows[f];
}

function makeFollowingHTML(handle) {
    return "<div class='following-handle'><span class='handle'>"+handle+'</span><button type="button" class="close" aria-label="Close" onclick="doUnfollow(this);"><span aria-hidden="true">&times;</span></button></div>';
}

function displayFollowing() {
    var handles = [];
    var following = Object.keys(App.follows);
    var len = following.length;
    for (var i = 0; i < len; i++) {
        var user = App.handles[following[i]];
        if (user != undefined) {
            handles.push(user.handle);
        }
    }
    handles.sort();
    $("#following").html("");
    len = handles.length;
    for (i = 0; i < len; i++) {
        $("#following").append(makeFollowingHTML(handles[i]));
    }
}

function updateFollowing(checkboxElem) {

    var hash = checkboxElem.getAttribute("hash");
    var following = App.follows[hash] === true;
    var userElem = $(checkboxElem).parent().parent().parent();
    var user = App.handles[hash];

    var fn = function() {
        getUserFollowingData(hash,function(audience,listening_to){
            userElem.html(makeUserHTML(user, audience, listening_to));
        });
    };

    if (following) {
        unfollow(hash,fn);
    } else {
        follow(hash,fn);
    }
}

function makeUserHTML(user, audience, listening_to) {
    var following = App.follows[user.hash] === true ? "checked" : "";
    return '<div class="user"> <span class="handle" title="'+user.hash+'">@'+user.handle+'</span> <span class="audience">'+audience+'</span> <span class="listening-to">'+listening_to+'</span> <span class="follow-button"><input hash="'+user.hash+'" onclick="updateFollowing(this);" type="checkbox" '+following+'></span> </div>';
}

function getUserFollowingData(user_hash,fn) {
    let p1 = new Promise(
        (resolve, reject) => {
            getFollow(user_hash,"following",function(data) {
                console.log("listening_to:", data);
                resolve(data.length);
            });});
    let p2 = new Promise(
        (resolve, reject) => {
            getFollow(user_hash,"followers",function(data) {
                console.log("audience:", data);
                resolve(data.length);
            });});
    Promise.all([p1, p2]).then(values => {
        fn(values[0],values[1]);
    });
}
function displayUsers() {
    var handles = [];
    var users = Object.keys(App.users);
    var len = users.length;
    for (var i = 0; i < len; i++) {
        var user = App.users[users[i]];
        if (user != undefined && users[i] != "" && user.hash != App.me) {
            handles.push(user.handle);
        }
    }
    handles.sort();
    $("#users").html("");
    len = handles.length;
    for (i = 0; i < len; i++) {
        var user = App.users[handles[i]];
        getUserFollowingData(user.hash,function(audience,listening_to){
            $("#users").append(makeUserHTML(user, audience, listening_to));
        });
    }
}


function displayPosts(filter) {
    var keys = [],
    k, i, len;

    for (k in App.posts) {
        if (filter != undefined) {
            if (filter.includes(App.posts[k].handle)) {
                keys.push(k);
            }
        } else {
            keys.push(k);
        }
    }

    keys.sort().reverse();

    len = keys.length;

    $("#meows").html("");
    for (i = 0; i < len; i++) {
        k = keys[i];
        var post = App.posts[k];
        $("#meows").append(makePostHTML(k,post));
    }
}

function doFollow() {
    var handle = $("#followHandle").val();

    send("getAgent",handle,function(data) {
        if (data != "") {
            follow(data);
        }
        else {
            alert(handle+" not found");
        }
        $('#followDialog').modal('hide');
        eval(Clutter.getHook("manual", "normalUI"));
    });
}

function doSearch() {
    $('#search-results').fadeIn();
    $("#people-results").html("");
    $("#people-results").append(makeResultHTML({handle:"Bob Smith!"}));
}

function hideSearchResults() {
    $('#search-results').fadeOut();
}

function searchTab(tab) {
    var tabs = $('.search-results-data');
    var len = tabs.length;
    for (i = 0; i < len; i++) {
        var t= tabs[i];
        var tj = $(t);
        var cur = t.id.split("-")[0];
        var tabj = $("#"+cur+"-tab");
        if (tab == cur) {
            tj.slideToggle();
            tabj.addClass('active-tab');
        }
        else {
            tj.slideToggle();
            tabj.removeClass('active-tab');
        }
    }
}

function doSetHandle() {
    var handle = $("#myHandle").val();

    send("newHandle",handle,function(data) {
        if (data != "") {
            getMyHandle();
        }
        $('#setHandleDialog').modal('hide');
        $(".spinner").toggleClass("show", false);
    });
}

function openFollow() {
    if (App.enableDirectoryAccess) {
        getHandles(function() {
            displayUsers();
            $('#usersDialog').modal('show');
        });
    }
    else {
        $("#followHandle").val("");
        displayFollowing();
        $('#followDialog').modal('show');
    }
}

function openSetHandle() {
    $('#myHandle').text(App.handle);
    $('#setHandleDialog').modal('show');
}

function openEditPost(id) {
    $("#editedMessage").val(App.posts[id].message);
    $('#postID').val(id);
    $('#editPostDialog').modal('show');
}

function doUnfollow(button) {
    // pull the handle out from the HTML
    var handle = $(button).parent().find('.handle')[0].innerHTML;
    var user = App.users[handle].hash;
    unfollow(user);
    $('#followDialog').modal('hide');
}

function showUser(user) {
    $('#meow-form').fadeOut();
    $('#user-header').html(getUserHandle(user));
    $('#user-header').fadeIn();
    App.posts={};
    getPosts([user]);
}

function showFeed() {
    $('#meow-form').fadeIn();
    $('#user-header').fadeOut();
    App.posts={};
    getMyFeed();
}

$(window).ready(function() {
    send("getProperty","enableDirectoryAccess", function(val) {
        if (Clutter.debug) console.log("enableDirectoryAccess=",val);
        App.enableDirectoryAccess = val == "true";
    });
    $("#submitFollow").click(doFollow);
    $('#followButton').click(openFollow);
    $("#handle").on("click", "", openSetHandle);
    $("#changeHandleButton").on("click", "", openSetHandle);
    $('#setHandleButton').click(doSetHandle);
    $('#search-results.closer').click(hideSearchResults);
    $('#user-header').click(showFeed);
    $('#editPostButton').click(doEditPost);

    $("#myHandle").on('keyup', function (e) {
      if (e.keyCode == 13) {
          doSetHandle()
      }
    });

    $("#followHandle").on('keyup', function (e) {
      if (e.keyCode == 13) {
          doFollow();
      }
    });

    getProfile();
    setInterval(getMyFeed, 1000);

});
