var Hapi = require("hapi");
var Path = require("path");
const Inert = require('inert');
const uuid = require("uuid")
var Async = require("async"),
    Bell = require("bell"),
    Blipp = require("blipp"),
    HapiAuthCookie = require("hapi-auth-cookie"),
    Hoek = require("hoek");
    // Api = require("./api"),
    // Authentication = require("./authentication"),
    // Controllers = require("./controllers"),
    // Models = require("./models"),
    // Routes = require("./routes");
var server = new Hapi.Server({
	connections:{
		routes:{
			files: {
				relativeTo: Path.join(__dirname, "./")
			}
		}
	}
});

var Cards = {};

server.connection({port: 3000});
server.register(Inert, () => {});

server.ext("onRequest", (request, reply) => {
	console.log("Request received: " + request.path)
	reply.continue();
});


server.route({
	path: "/",
	method: "GET",
	handler: {
        file: 'templates/index.html'
    }
});

server.route({
	path: "/assets/{path*}",
	method: "GET",
	handler: {
		"directory": {
			"path": "./public",
			// "Listing": false
		}
	}
});

server.route({
	path: "/cards",
	method: "GET",
	handler(req, reply){
		reply.file("templates/cards.html")
	}
});

server.route({
	path: "/cards/new",
	method: ["GET", "POST"],
	handler(req, reply){
		if(req.method === "get"){
			reply.file("templates/new.html")
		} else {
			var card = {
				name: req.payload.name,
				recipient_email: req.payload.recipient_email,
				sender_name: req.payload.sender_name,
				sender_email: req.payload.sender_email,
				card_image: req.payload.card_image
			};
			saveCard(card);

			console.log(Cards)
			reply.redirect("/cards")
		}
	}
});
server.route({
	path: "/cards/{id}",
	method: "DELETE",
	handler(req, reply){
		delete Cards[req.params.id];
	}
});


function saveCard(card){
	var id = uuid.v1();
	card.id = id;
	Cards[id] = card;
}


server.start(() => {
	console.log("listening on" + server.info.uri)
});