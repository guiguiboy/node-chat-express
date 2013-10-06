var Manager = function(){
	this.messages = [];
};
	
Manager.prototype.push = function (username, post) {
	this.messages.push({
		user: username,
		post: post,
	});
};

Manager.prototype.list = function (username, post) {
	return this.messages;
};

exports.Manager = Manager;