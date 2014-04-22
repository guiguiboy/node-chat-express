var validator     = require('validator');

/**
 * Index route
 */
exports.index = function(req, res){
	if (typeof req.session.username == "undefined") {
		res.redirect('/signin');
	} else {
		res.render('chat', { title: 'nodeChatExpress'});
	}
	
};

/**
 * GET sign in route
 */
exports.getSignin = function(req, res){
	res.render('signin', { title: 'nodeChatExpress', errors: []});
};

/**
 * POST sign in route
 */
exports.postSignin = function(req, res){
	var username = req.body.username;
	var errors   = [];
	
	
	if (username == '') {
		errors.push('You must choose a name');
	}
	if (validator.validators.notRegex(username, /[a-z0-9-_]+/i)) {
		errors.push('Username is not allowed.');
	}
	
	if (errors.length > 0) {
		res.render('signin', { title: 'nodeChatExpress', errors: errors});
	} else {
		req.session.username = username;
		res.redirect('/');
	}
};
