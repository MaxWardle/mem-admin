'use strict';
// =========================================================================
//
// Policies for orgs
//
// =========================================================================
var acl  = require ('acl');
acl      = new acl (new acl.memoryBackend ());
var helpers  = require (require('path').resolve('./modules/core/server/controllers/core.helpers.controller'));

exports.invokeRolesPolicies = function () {
	helpers.setCRUDPermissions (acl, 'emailTemplate');
};

exports.isAllowed = helpers.isAllowed (acl);


