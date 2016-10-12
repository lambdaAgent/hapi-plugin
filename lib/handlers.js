const fs = require("fs");
const uuid = require("uuid");
const Joi = require("joi"),
      Boom = require("boom")
const CardStore = require("./cardStore.js");
var UserStore = require("./userStore");

var cardSchema = Joi.object().keys({
	name: Joi.string().min(3).max(50).required(),
	recipient_email: Joi.string().email().required(),
	sender_name: Joi.string().min(3).max(50).required(),
	card_image: Joi.string().regex(/.+\.(jpg|bmp|png|gif)\b/)
});

var loginSchema = Joi.object().keys({
	email: Joi.string().email().required(),
	password: Joi.string().max(32).required()
});

var registerSchema = Joi.object().keys({
	email: Joi.string().email().required(),
	password: Joi.string().max(32).required(),
	email: Joi.string().email().required()
})

var Handlers = {};

// -------------
//    HELPER
// -------------


const saveCard = function(card){
	var id = uuid.v1();
	card.id = id;
	CardStore.cards[id] = card;
}

const mapImages = function(){
	return fs.readdirSync("./public/images/cards");
}
Handlers.cardsHandler = function(req, reply){
	reply.view("cards", {cards: getCards(req.atuh.credentials.email)});
}
Handlers.deleteCardHandler = function(req, reply){
	delete CardStore.cards[req.params.id];
	reply();
}
Handlers.newCardHandler = function(req, reply){
	if(req.method === "get"){
		reply.view("new", {card_images: mapImages() })
	} else {
		Joi.validate(req.payload, cardSchema, (err, val) => {
			if(err) {
				return reply(Boom.badRequest(err.details[0].message))
			}

			var card = {
				name: val.name,
				recipient_email: val.recipient_email,
				sender_name: val.sender_name,
				sender_email: val.sender_email,
				card_image: val.card_image
			};
			saveCard(card);

			reply.redirect("/cards")
		})
	
	}
}

Handlers.loginHandler = function(req, reply){
	Joi.validate(req.payload, loginSchema, function(err, val){
		if(err) return reply(Boom.unauthorized("Credentials did not validate"))
		UserStore.validateUser(val.email, val.password, function(err, user){
			if(err) return relpy(err);

			req.auth.seesion.set(user);
			reply.redirect("/cards");
		})
	})
}

Handlers.logoutHandler = function(req, reply){
	req.auth.session.clear();
	reply.redirect("/")
};


Handlers.registerHandler = function(req, reply){
	if(req.method === "get"){
		reply.view("register")
	} else {
		Joi.validate(req.payload, registerSchema, function(err, val){
			if(err) return reply(Boom.unauthorized("Credentials did not validate"))
			UserStore.createUser(val.name, val.email, val.password, function(err, user){
				if(err) return relpy(err);

				reply.redirect("/cards");
			})
		})
	}
}

Handlers.uploadHandler = function(request, reply){
	var image = request.payload.upload_image;
	if(image.bytes){
		fs.link(image.path, 'public/images/cards' + image.filename, function(){
			fs.unlink(image.path);
		})
	}
	reply.redirect("/cards");
}

Handlers.sendCardHandler = function(req, reply){
	var card = CardStore.cards[req.params.id];
	request.server.render("email", card, function(err, rendered){
		var message = {
			html: rendered,
			subject: "A greeting from hapi Greetings",
			from_email: card.sender_email,
			from_name: card.sender_name,
			to: [
				{
					email: card.recipient_email,
					name: card.name,
					type: "to"
				}
			]
		}

		mandrillClient.messages.send({message: message}, function(results){
			if(results.reject_reason){
				console.log(results.reject_reason);
				reply(Boom.badRequest("Could not send card"))
			} else {
				reply.redirect("/cards");
			}
		}, function(err) {
			console.log(err);
			reply(Boom.badRequest("Could not send card"))
		})
	});
}

Handlers.cardHandler = function(request, reply) {
	var card = CardStore.cards[request.params.id];
	return reply.view("card", card);
}


module.exports = Handlers




function getCards(email){
	var cards = [];
	for(var key in CardStore.cards){
		if(CardStore.cards[key].sender_email === email){
			cards.push(CardStore.cards[key]);
		}

	}
	return cards;
}

