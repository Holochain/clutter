function genesis() {
  addAnchor();
  return true;
}

//USED IN GENESIS TO AN THE INITIAL ANCHOR

function getMainAchorHash()
{
  var anchorMain = {Anchor_Type:"Anchor_Type",Anchor_Text:""};
  var hashAnchorMain = makeHash(anchorMain);
  return hashAnchorMain;
}

function getAnchorTypeHash(anchor_type)
{
  var anchorType = {Anchor_Type:anchor_type,Anchor_Text:""};
  var anchorTypeHash = makeHash(anchorType);
}
function addAnchor()
{
  var dna = App.DNA.Hash;
  var anchor_main = {Anchor_Type:"Anchor_Type",Anchor_Text:""};
  var key=commit("anchor",anchor_main);
  commit("directory_links", {Links:[{Base:dna,Link:key,Tag:"Anchor"}]});
  return anchor;
}

//USED TO CREATE A NEW Anchor_Type
function anchor_type_create(anchor_type)
{
  var anchor_main_hash=getMainAchorHash();
  var new_anchorType= {Anchor_Type:anchor_type,Anchor_Text:""};
  var key=commit("anchor",new_anchorType);
  commit("anchor_links",{Links:[{Base:anchor_main_hash,Link:key,Tag:"Anchor_Type"}]});
}

function anchor_create(anchor_type,anchor_text)
{
  var new_anchor = {Anchor_Type:anchor_type,Anchor_Text:anchor_text};
  var anchorTypeHash = getAnchorTypeHash(anchor_type);

  var new_anchorHash=commit(anchorTypeHash,new_anchor);
  anchor_link(anchorTypeHash,new_anchorHash);
}

function anchor_link(anchor_type,anchor_text)
{
  commit("anchorType_links",{Links:[{Base:anchor_type,Link:anchor_text,Tag:"Anchor"}]});
}

function anchor_update(anchor_type,old_anchorText,new_anchorText)
{
  var oldAnchor={Anchor_Type:anchor_type,Anchor_Text:old_anchorText};
  var oldAnchorHash = makeHash(oldAnchor);

  var newAnchor={Anchor_Type:anchor_type,Anchor_Text:new_anchorText};
  var newAnchorHash = makeHash(newAnchor);

  var anchorTypeHash = getFavouritePosts();

  var updatedAnchor = update("anchor",newAnchorHash,oldAnchorHash);
  debug("Anchor text successfully updated ! New anchor hash : "+updatedAnchor);
  anchor_updatelink(anchorTypeHash,oldAnchorHash,newAnchorHash);
}

function anchor_updatelink(anchorTypeHash,oldAnchorHash,newAnchorHash)
{
  commit("anchorType_links",
         {Links:[
             {Base:anchorTypeHash,Link:oldAnchorHash,Tag:"Anchor",LinkAction:HC.LinkAction.Del},
             {Base:anchorTypeHash,Link:newAnchorHash,Tag:"Anchor"}
         ]});
}

// List all the anchor types linked to from "AnchorType" created in genesis
function anchor_type_list(anchor_type)
{
  var anchor_type_list=[];
  anchor_main_hash=getMainAchorHash();
  var anchor_type=doGetLinkLoad(anchor_main_hash,"");

  for(var j=0;j<anchor_type.length;j++){
    anchor_type_list=push(anchor_type[j]);
  }
return anchor_type_list;
}


/*****
*****/
// helper function to do getLink call, handle the no-link error case, and copy the returned entry values into a nicer array
function doGetLinkLoad(base, tag) {
    // get the tag from the base in the DHT
    var links = getLink(base, tag,{Load:true});
    if (isErr(links)) {
        links = [];
    } else {
        links = links.Links;
    }
    var links_filled = [];
    for (var i=0;i <links.length;i++) {
        var link = {H:links[i].H};
        link[tag] = links[i].E;
        links_filled.push(link);
    }
    debug("Links Filled:"+JSON.stringify(links_filled));
    return links_filled;
}
// helper function to determine if value returned from holochain function is an error
function isErr(result) {
    return ((typeof result === 'object') && result.name == "HolochainError");
}
