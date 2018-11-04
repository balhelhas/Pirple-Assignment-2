/*
*
*   Data library for storing and editing
*
*/ 

//Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

//Library container
const lib = {}

//Library base directory for data 
lib.baseDir = path.join(__dirname,'../.data/')

//Create file and write data
lib.create = (dir, fileName, data, callback) => {
    // Open the file for writting
    fs.open(lib.baseDir+dir+'/'+fileName+'.json','wx',(err,fileDescriptor) => {
        if(!err && fileDescriptor){
            // Convert data to string
            var strData = JSON.stringify(data)
            // Write to file and close it
            fs.writeFile(fileDescriptor,strData,err =>{
                if(!err)
                    fs.close(fileDescriptor,err => { 
                        if(!err) callback(false) 
                        else callback('ERROR: Closing new file!')
                    })
                else callback('ERROR: Writing to new file!')
            })
        }else callback('ERROR: Creating new file, it may already exist!')
    })
}

//Read file data
lib.read = (dir,fileName,callback) => {
    fs.readFile(lib.baseDir+dir+'/'+fileName+'.json','utf-8',(err,data) => {
        if(!err && data) callback(err,helpers.parseJsonToObject(data))
        else callback(err,data)
    })
}

//Update file data
lib.update = (dir, fileName, data, callback) => {
    //Open the file to write
    fs.open(lib.baseDir+dir+'/'+fileName+'.json', 'r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor){
            //Convert data to string
            var strData = JSON.stringify(data)
            //Truncate the file
            fs.ftruncate(fileDescriptor, err => {
                if(!err)
                    // Write to file and close it
                    fs.writeFile(fileDescriptor, strData, err => {
                        if(!err)
                            fs.close(fileDescriptor, err => {
                                if(!err) callback(false)
                                else callback('ERROR: Closing the file!')
                            })
                        else callback('ERROR: Writing to existing file!')
                    })
                else callback('ERROR: Truncating file!')
            })
        }else callback('ERRO: Updating file, it may not exist!')
    })
}

//Delete file
lib.delete = (dir,fileName,callback) => {
    fs.unlink(lib.baseDir+dir+'/'+fileName+'.json',err => {
        if(!err) callback(false)
        else callback('ERROR: Unable to delete file!')
    })
};

//List all items at given directory
lib.list = (dir,callback) => {
    fs.readdir(lib.baseDir+dir+'/',(err,data) => {
        if(!err && data && data.length > 0){
            let trimmedFileNames = []
            data.forEach(fileName => trimmedFileNames.push(fileName.replace('.json','')))
            callback(false,trimmedFileNames)
        }else callback(err,data)
    })
}

//Export the module
module.exports = lib;
