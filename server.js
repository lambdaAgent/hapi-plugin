var Hapi = require("hapi");
var Path = require("path");
var fs = require("fs");
const Inert = require('inert');
const uuid = require("uuid");
var UserStore = require("./lib/userStore");
var Async = require("async"),
    Bell = require("bell"),
    Blipp = require("blipp"),
    Good = require("good"),
    Vision = require("vision"),
    HapiAuthCookie = require("hapi-auth-cookie"),
    Hoek = require("hoek");
    // Api = require("./api"),
    // Authentication = require("./authentication"),
    // Controllers = require("./controllers"),
    // Models = require("./models"),
    // Routes = require("./routes");

var Handlers = require("./lib/handlers");
var CardStore = require("./lib/CardStore");
CardStore.initialize();
UserStore.initialize();

var server = new Hapi.Server({
	connections:{
		routes:{
			files: {
				relativeTo: Path.join(__dirname, "./")
			}
		}
	}
});



server.connection({port: 3000});
server.register([Inert, Vision, 
	// {
	// 	register: Good,
	// 	options: {
	// 		opsInterval: 5000,
	// 		reporters: [
	// 			{
	// 				reporter: require('good-file'),
	// 				events: { ops: '*' },
	// 				config: {
	// 					path: "./logs",
	// 					prefix: "hapi-process",
	// 					rotate: "daily"
	// 				}
	// 			},
	// 			{
	// 				reporter: require("good-file"),
	// 				events: { response: "*"},
	// 				config: {
	// 					path: "./logs",
	// 					prefix: "hapi-requests",
	// 					rotate:"daily"
	// 				}
	// 			},
	// 			{
	// 				reporter: require("good-file"),
	// 				events: { response: "*"},
	// 				config: {
	// 					path: "./logs",
	// 					prefix: "hapi-error",
	// 					rotate:"daily"
	// 				} 
	// 			}
	// 		]
	// 	}
	// }
	]
	, function(err){
		if(err) throw err;
	}
);
server.register(require("hapi-auth-cookie"), function(err){
	if(err) console.log(err);
	server.auth.strategy('default', 'cookie', {
		password: "myPassword",
		redirectTo: "./login",
		isSecure: false
	});

	server.auth.default("default");
});

server.views({
	engines: {
		html: require("handlebars")
	},
	path: "./templates"
})

server.ext("onPreResponse", (req, reply) => {
	if(req.response.isBoom){
		return reply.view('error', req.response);
	}
	reply.continue();
});

server.route(require("./lib/routes"));


server.start(() => {
	console.log("listening on" + server.info.uri)
});