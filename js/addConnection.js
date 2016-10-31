
var doc= document;
var common= '<li class="breadcrumb-item"> Amazon S3:</li>'

/**
 *  This triggers on click of s3Connection
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
        $("#testresult").html(" <div class='alert alert-success moveleft moveright'> <strong>Bucket exists</strong></div>")
    };
    var cb_fail=function(data){
        $("#testresult").html(" <div class='alert alert-success moveleft moveright'> <strong> Failure</strong></div>")
    };
    var param= {"prefix":'', "delimiter":'/'};
    requestS3(bucketName,accessKey,secretKey,param,"GET","xml",cb_success,cb_fail)

}

function requestS3(bucketName, accessKey,secretKey,param,type,dataType,cb_succes, cb_fail){
    var signedUrl= getSingedUrl(bucketName,accessKey,secretKey,param,type);
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

function connectionView(evt){
    $(".addconnection").addClass("hide");
    $(".viewconnection").removeClass("hide");
    $('#myModal').modal('hide');
    $("#prefix").empty();
    $("#prefix").append(common);
    chrome.storage.sync.get($(evt.target).attr("data-connect"), function (obj) {
        $("#prefix").append('<li class="breadcrumb-item"> <a href="#" data-root="'+obj.bucketName+'"'+ obj.bucketName+'</li>');
        localStorage.setItem("accessKey",obj.accessKey);
        localStorage.setItem("secretToken",obj.secretToken);
        localStorage.setItem("bucketName",obj.bucketName);
        var param= {"prefix":'', "delimiter":'/'};
        requestS3(localStorage.getItem("bucketName"),localStorage.getItem("accessKey"),localStorage.getItem("secretToken"),param,"GET","xml",cb_success);
        var cb_success= function(data){
            $("#dataTable").empty();
           var rows="";
            var prefixes=xml2json(data,"");
            prefixes.forEach(function(prefix){
                rows=rows+'<tr><td><a href="#" data-prefix="'+prefix+'">'+prefix+'</a></td></tr>'
            });
          $("#dataTable").append(rows);
        }
    });
}

function  deleteConnection(evt){
    chrome.storage.sync.remove($(evt.target).attr("data-delete"), function(Items) {
        alert("Connection removed");
        populateConnections();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    showModal();
    document.querySelector('#showExistingConnections').addEventListener('click', populateConnections);
    document.querySelector('#s3Connection').addEventListener('click', addConnection);
    document.querySelector('#cancel').addEventListener('click', cancelCreation);
    document.querySelector('#submit').addEventListener('click', saveConnectionDetails);
    document.querySelector('#test').addEventListener('click', testConnection);
});