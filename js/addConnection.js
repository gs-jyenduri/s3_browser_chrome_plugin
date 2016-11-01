
var doc= document;
var common= '<li class="breadcrumb-item"> Amazon S3:</li>';
var common_table='<tr><td><b>Name</b></td><td><b>Size</td><td><b>Last Modified</b></td> <td><b>Delete</b></td></tr>'

/**
 *  This triggers on click of s3Connection
 *
 */
function  addConnection(){
    $("#connectionName").val("");
    $("#accessKey").val("");
    $("#secretKey").val("");
    $("#bucketName").val("");
    $("#bucketConfiguration").removeClass("hide");
    $("#bucketFooter").removeClass("hide");
    $(".populateConnections").addClass("hide");
    $("#testresult").addClass("hide");
}
/**
 * To hide the creationPanel
 */
function  cancelCreation(){
    $("#bucketConfiguration").addClass("hide");
    $("#bucketFooter").addClass("hide");
    $(".populateConnections").removeClass("hide");
}
/**
 * To store the bucket information
 */
function  saveConnectionDetails(){
    var connectionName= $("#connectionName").val();
    var accessKey=$("#accessKey").val();
    var secretToken=$("#secretKey").val();
    var bucketName=$("#bucketName").val();
    var connectionDetail = {"connectionName": connectionName,"accessKey" : accessKey,"secretToken":secretToken,"bucketName":bucketName};
    var key = bucketName;
    var jsonfile = {};
    jsonfile[key] = connectionDetail;

    chrome.storage.sync.set(jsonfile, function() {
        // Notify that we saved.
        $("#testresult").removeClass("hide").html(" <div class='alert alert-success moveleft moveright'> <strong>Success!</strong></div>")
    });
    populateConnections();
}
function populateConnections(){
    $("#bucketConfiguration").addClass("hide");
    $("#bucketFooter").addClass("hide");
    $(".populateConnections").removeClass("hide");
    var allKeys =[];
    var columns="";
    chrome.storage.sync.get(null, function(items) {
        $("#connectionTables").empty();
        allKeys = Object.keys(items);
        allKeys.forEach(function(key){
            columns=columns+"<tr> + <td data-id="+key+"> "+key+" </td><td><button class='btn btn-success btn-sm' data-connect="+key+" type='button'> Connect</button> </td><td><button class='btn btn-danger btn-sm'  id='deleteRow' data-delete="+key+" type='button'> Delete</button> </td> </tr>";
        });
        $("#connectionTables").append(columns);
        var deleteElements =document.querySelectorAll('[data-delete]');
        for (var i = 0; i < deleteElements.length; i++) {
            deleteElements[i].addEventListener('click', deleteConnection);
        }
        var connectElements =document.querySelectorAll('[data-connect]');
        for (var i = 0; i < connectElements.length; i++) {
            connectElements[i].addEventListener('click', connectionView);
        }
    });

}
/**
 * Test the S3 Connection
 */
function  testConnection(){
    var accessKey = $("#accessKey").val();
    var secretKey =$("#secretKey").val();
    var bucketName=$("#bucketName").val();
    $("#testresult").empty().removeClass("hide");
    var cb_success= function(data){
        console.log(xml2json(data,""));
        //s.ListBucketResult.Contents
        $("#testresult").html(" <div class='alert alert-success moveleft moveright'> <strong>Authentication Successful !</strong></div>")
    };
    var cb_fail=function(data){
        $("#testresult").html(" <div class='alert alert-warning moveleft moveright'> <strong> Failure</strong></div>")
    };
    var param= {"prefix":'', "delimiter":'/'};
    requestS3(bucketName,accessKey,secretKey,param,"GET","xml",cb_success,cb_fail)

}

function requestS3(bucketName, accessKey,secretKey,param,type,dataType,cb_succes, cb_fail,key,getUrl, content_type){
    var signedUrl= getSingedUrl(bucketName,accessKey,secretKey,param,type,key,content_type);
    if(typeof getUrl != "undefined" && getUrl){
        return signedUrl
    }
    $.ajax(  {
        url: signedUrl,
        dataType: dataType,
        type: type,
        success:cb_succes,
        fail:cb_fail
    })
}

function showModal(){
    $('#myModal').modal('show');
}
/**
 * Handles table creation
 * @param data
 */
var cb_success= function(data){
    $("#dataTable").empty();
    var noPrefix=false;
    var noContent=false;
    var rows=common_table;
    var xmlTojson= JSON.parse(xml2json(data,""));
    var contents =xmlTojson.ListBucketResult.Contents;
    if(typeof contents !="undefined") {
        if (Array.isArray(contents)) {
            contents.forEach(function (content) {
                if(content.Size == 0){
                    if(content.Key.indexOf("hackFile45") >-1){
                        var temp_String=content.Key.replace("hackFile45","")
                        rows = rows + '<tr><td><a href="#" data-preprefix="' + temp_String + '">' + temp_String + '</a></td> <td>&uarr;</td><td></td><td></td></tr>'

                    }else {
                        rows = rows + '<tr><td><a href="#" data-preprefix="' + content.Key + '">' + content.Key + '</a></td> <td>&uarr;</td><td></td><td></td></tr>'
                    }
                }else {
                    rows = rows + '<tr><td><a href="'+clickDataDownload(content.Key)+'" data-content="' + content.Key + '">' + content.Key + '</a></td><td>' + bytesToSize(content.Size) + '</td><td>' + new Date(content.LastModified) + '</td><td><button class="btn btn-danger" data-delete-s3="'+content.Key+'">Delete</button></td></tr>'
                }
            });
        } else {
             if(contents.Size == 0){
                     if(contents.Key.indexOf("hackFile45") >-1) {
                         var temp_String = contents.Key.replace("hackFile45", "");
                         rows = rows + '<tr><td><a href="#" data-preprefix="' + temp_String + '">' + temp_String + '</a></td> <td> &uarr;</td><td></td><td></td></tr>'
                    }else{
                         rows = rows + '<tr><td><a href="#" data-preprefix="' + contents.Key + '">' + contents.Key + '</a></td> <td> &uarr;</td><td></td><td></td></tr>'
                     }
             }else {
                 rows = rows + '<tr><td><a href="'+clickDataDownload(contents.Key)+'" data-content="' + contents.Key + '">' + contents.Key + '</a></td><td>' + bytesToSize(contents.Size) + '</td><td>' + new Date(contents.LastModified) + '</td><td><button class="btn btn-danger" data-delete-s3="'+contents.Key+'">Delete</button></td></tr>'
             }
        }
    }else{
        noContent=true;
    }
    var prefixes=xmlTojson.ListBucketResult.CommonPrefixes;
    if( typeof  prefixes!="undefined") {
        if (Array.isArray(prefixes)) {
            prefixes.forEach(function (prefix) {
                rows = rows + '<tr><td><a href="#" data-prefix="' + prefix.Prefix + '">' + prefix.Prefix + '</a></td><td></td><td></td><td></td></tr>'
            });
        } else {
            rows = rows + '<tr><td><a href="#" data-prefix="' + prefixes.Prefix + '">' + prefixes.Prefix + '</a></td></td><td></td><td><td></td></tr>'
        }
    }else{
        noPrefix=true;
    }
    if(noPrefix && noContent){
        rows+='<tr><td>Nothing is Here !</td></tr>'
    }
    $("#dataTable").append(rows);
    setEventForPrefix();
    setEventForPrePrefix();
    setEventForDelete();

};

function connectionView($evt){
    $evt.stopPropagation();
    var s3BucketName = $evt.target.getAttribute('data-connect');
    this.name1= s3BucketName;
    var self= this;
    $(".addconnection").addClass("hide");
    $(".viewconnection").removeClass("hide");
    $('#myModal').modal('hide');
    $("#prefix").empty();
    $("#prefix").append(common);
    chrome.storage.sync.get(s3BucketName, function (obj) {
        $("#prefix").append('<li class="breadcrumb-item">'+ obj[self.name1].bucketName+'</li>');
        localStorage.setItem("accessKey",obj[self.name1].accessKey);
        localStorage.setItem("secretToken",obj[self.name1].secretToken);
        localStorage.setItem("bucketName",obj[self.name1].bucketName);
        var param= {"prefix":'', "delimiter":'/'};
        requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),param,"GET","xml",cb_success);
    });
}

function setEventForDownload(){
    var dataDownloads =document.querySelectorAll('[data-content]');
    for (var i = 0; i < dataDownloads.length; i++) {
        dataDownloads[i].addEventListener('click', clickDataDownload);
    }
    return this;
}

function  setEventForDelete(){
    var dataDeletes =document.querySelectorAll('[data-delete-s3]');
    for (var i = 0; i < dataDeletes.length; i++) {
        dataDeletes[i].addEventListener('click', clickDataDeleteS3);
    }
    return this;
}

function clickDataDeleteS3(evt){
    var prePrefix ="";
    var actualString= escape($(evt.target).attr("data-delete-s3"));
    if(actualString.indexOf("/") >-1){
        prePrefix=actualString.substring(0,actualString.lastIndexOf("/")+1);
    }

    var cb_success= function(){
        var s;
        clickDataPrefix(s,prePrefix);
    };
    var cb_fail =function(){
        console.log("Download failed")
    };
    requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),param,"DELETE","xml",cb_success,cb_fail,escape($(evt.target).attr("data-delete-s3")),false);
}

function getCurrentPath(){
    var listItems = $("#prefix li");
    var prefix="";
    for(var i=2; i < listItems.length ; i++){
        prefix+= $(listItems[i]).text()
    }
    return prefix;
}
function clickDataDownload(key){
    var cb_success=function(data){
        console.log("success",data);
    };
    var cb_fail= function(){
        console.log("Fail");
    };
    return requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),param,"GET","xml",cb_success,cb_fail,escape(key),true);
}
function clickDataPrefix(evt,path){
    var prefixPath="";
    var dataRootPath="";
    if(typeof path!= "undefined"){
        prefixPath +=path;
        dataRootPath += '<li class="breadcrumb-item">' + localStorage.getItem("bucketName") + '</li>';
        dataRootPath += '<li class="breadcrumb-item">' + path + '</li>';
        $("#prefix").empty();
        $("#prefix").append(common);
        $("#prefix").append(dataRootPath);
        var param = {"prefix": prefixPath, "delimiter": '/'};
        requestS3(localStorage.getItem("bucketName"), localStorage.getItem("accessKey"), localStorage.getItem("secretToken"), param, "GET", "xml", cb_success);
        return this;
    }else {
        prefixPath += $(evt.target).attr("data-prefix");
        dataRootPath += '<li class="breadcrumb-item">' + localStorage.getItem("bucketName") + '</li>';
        dataRootPath += '<li class="breadcrumb-item">' + $(evt.target).attr("data-prefix") + '</li>';
        $("#prefix").empty();
        $("#prefix").append(common);
        $("#prefix").append(dataRootPath);
        var param = {"prefix": prefixPath, "delimiter": '/'};
        requestS3(localStorage.getItem("bucketName"), localStorage.getItem("accessKey"), localStorage.getItem("secretToken"), param, "GET", "xml", cb_success);
        return this;
    }
};

function setEventForPrefix(){
    var dataPrefixes =document.querySelectorAll('[data-prefix]');
    for (var i = 0; i < dataPrefixes.length; i++) {
        dataPrefixes[i].addEventListener('click', clickDataPrefix);
    }
    return this;
}

function setEventForPrePrefix(){
    var dataRoot =document.querySelectorAll('[data-preprefix]');
    for (var i = 0; i < dataRoot.length; i++) {
        dataRoot[i].addEventListener('click', clickDataPrePrefix);
    }
    return this;
}

function clickDataPrePrefix(evt){
    var prefixPath="";
    var dataRootPath="";
    var actualString=$(evt.target).attr("data-preprefix").substring(0, $(evt.target).attr("data-preprefix").length-1);
    var prePrefix ="";
    if(actualString.indexOf("/") >-1){
        prePrefix=actualString.substring(0,actualString.lastIndexOf("/")+1);
    }
    prefixPath+= prePrefix;
    dataRootPath+= '<li class="breadcrumb-item">'+ localStorage.getItem("bucketName")+'</li>';
    dataRootPath+= '<li class="breadcrumb-item">'+ prePrefix +'</li>';
    $("#prefix").empty();
    $("#prefix").append(common);
    $("#prefix").append(dataRootPath);
    var param= {"prefix":prefixPath, "delimiter":'/'};
    requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),param,"GET","xml",cb_success);

}

function changeBucket(){
    $(".addconnection").removeClass("hide");
    $(".viewconnection").addClass("hide");
     showModal();
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

function  deleteConnection(evt){
    chrome.storage.sync.remove($(evt.target).attr("data-delete"), function(Items) {
        alert("Connection removed");
        populateConnections();
    });
}

function uploadFile(){
    $(".fileUploadView").removeClass("hide");
    $('#fileModal').modal('show');
}

function  fileClose(){
    $(".fileUploadView").addClass("hide");
    $('#fileModal').modal('hide');
    var k;
    clickDataPrefix(k,getCurrentPath());
}

function fileSave(){
         var filePath= this.files[0];
        $("#files").append($("#fileUploadProgressTemplate").tmpl());
        $("#fileUploadError").addClass("hide");
        var key = escape(getCurrentPath()+this.files[0].name);
        var ABC;
        var url=  requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),ABC,"PUT","xml","","",key,true, this.files[0].type);
        $.ajax({
            url: url,
            type: 'PUT',
            xhr: function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(evt) {
                        var percent = (evt.loaded / evt.total) * 100;
                        $("#files").find(".progress-bar").width(percent + "%");
                    }, false);
                }
                return xhr;
            },
            success: function(data) {
                $("#files").children().last().remove();
                $("#files").append($("#fileUploadItemTemplate").tmpl(data));
                $("#uploadFile").closest("form").trigger("reset");
            },
            error: function() {
                $("#fileUploadError").removeClass("hide").text("An error occured!");
                $("#files").children().last().remove();
                $("#uploadFile").closest("form").trigger("reset");
            },
            data:filePath,
            cache: false,
            contentType: false,
            processData: false
        });
}

function showAddFolderView(){
    $(".addFolderView").removeClass("hide");
    $("#addFolderModal").modal("show");
}

function hideAddFolderView(){
    $(".addFolderView").addClass("hide");
    $("#addFolderModal").modal("hide");
}

function createNewFolder(){
    var file=new File([""], "hackFile45");
    var key = escape(getCurrentPath()+$("#newFolderName").val()+"/"+"hackFile45");
    var ABC;
    var url=  requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),ABC,"PUT","xml","","",key,true);
    var cb_succes = function(){
        clickDataPrefix(ABC,getCurrentPath());
        hideAddFolderView();
    };
    var cb_fail = function(){
        console.log("Fail");
    };
    $.ajax(  {
        url: url,
        type: "PUT",
        success:cb_succes,
        fail:cb_fail,
        data:file,
        cache: false,
        contentType: false,
        processData: false
    })

}

document.addEventListener('DOMContentLoaded', function () {
    showModal();
    document.querySelector('#showExistingConnections').addEventListener('click', populateConnections);
    document.querySelector('#s3Connection').addEventListener('click', addConnection);
    document.querySelector('#cancel').addEventListener('click', cancelCreation);
    document.querySelector('#submit').addEventListener('click', saveConnectionDetails);
    document.querySelector('#test').addEventListener('click', testConnection);
    document.querySelector('#changeBucket').addEventListener('click', changeBucket);
    document.querySelector('#uploadFileClick').addEventListener('click', uploadFile);
    document.querySelector('#fileClose').addEventListener('click', fileClose);
    document.querySelector('#uploadFile').addEventListener('change', fileSave);
    document.querySelector('#addFolder').addEventListener('click', showAddFolderView);
    document.querySelector('#closeAddFolder').addEventListener('click', hideAddFolderView);
    document.querySelector('#clickAddFolder').addEventListener('click', createNewFolder);


});