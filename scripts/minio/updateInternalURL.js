/*global db */

/**
  * This script updates the internalURL property of each document so that it will become compatibel with Minio's bucket structure.
  * It removes the previously hard-coded "/uploads/" heading, as with Minio the bucket name is not part of a filesystem path.
  */
print('Updating...');
var updateCount = 0;
db.documents.find().forEach(function(doc){
  var newURL = doc.internalURL.replace(/^(\/)?(uploads)?\//, '');
  print('New internalUrl is: ' + newURL);
  updateCount++;
  db.documents.update({_id : doc._id}, { $set : { internalURL : newURL }});
});
print('Update completed, processed ' + updateCount + ' documents.');
