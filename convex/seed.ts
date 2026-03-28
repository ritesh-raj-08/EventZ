import { internalMutation } from "./_generated/server";

/* ======================================================
   Types
====================================================== */

type TicketType = "free" | "paid";

interface SampleEvent {
  title: string;
  description: string;
  category: string;
  tags: string[];
  capacity: number;
  ticketType: TicketType;
  price?: number;
  coverImage?: string;
  themeColor?: string;
}

/* ======================================================
   Jharkhand Locations
====================================================== */

const LOCATIONS = [
  {
    city: "Ranchi",
    state: "Jharkhand",
    venue: "Birsa Munda Stadium",
    address: "Morabadi, Ranchi",
  },
  {
    city: "Jamshedpur",
    state: "Jharkhand",
    venue: "JRD Tata Sports Complex",
    address: "Bistupur, Jamshedpur",
  },
  {
    city: "Dhanbad",
    state: "Jharkhand",
    venue: "IIT ISM Campus",
    address: "Sardar Patel Nagar, Dhanbad",
  },
  {
    city: "Bokaro",
    state: "Jharkhand",
    venue: "City Park",
    address: "Sector 4, Bokaro",
  },
  {
    city: "Deoghar",
    state: "Jharkhand",
    venue: "Baidyanath Dham Hall",
    address: "Deoghar",
  },
];

/* ======================================================
   EVENTS DATA (30+ events)
====================================================== */

const SAMPLE_EVENTS: SampleEvent[] = [

{
title:"React 19 Workshop",
description:"Master React 19 features",
category:"tech",
tags:["react","tech"],
capacity:50,
ticketType:"free",
coverImage:"https://images.unsplash.com/photo-1633356122544-f134324a6cee",
themeColor:"#4c1d95"
},

{
title:"AI & LLM Bootcamp",
description:"Learn AI and LLM",
category:"tech",
tags:["ai"],
capacity:80,
ticketType:"paid",
price:999,
coverImage:"https://images.unsplash.com/photo-1677442136019",
themeColor:"#1e3a8a"
},

{
title:"Music Fest Ranchi",
description:"Live music festival",
category:"music",
tags:["music"],
capacity:200,
ticketType:"paid",
price:499,
coverImage:"https://images.unsplash.com/photo-1511671782779",
themeColor:"#831843"
},

{
title:"Startup Meetup Jharkhand",
description:"Startup networking",
category:"business",
tags:["startup"],
capacity:100,
ticketType:"free"
},

{
title:"Photography Workshop",
description:"Street photography",
category:"art",
tags:["photography"],
capacity:40,
ticketType:"paid",
price:399
},

{
title:"Full Stack Bootcamp",
description:"Learn Fullstack dev",
category:"education",
tags:["coding"],
capacity:60,
ticketType:"free"
},

{
title:"Football Tournament",
description:"Local football",
category:"sports",
tags:["sports"],
capacity:100,
ticketType:"paid",
price:200
},

{
title:"Cooking Workshop",
description:"Cooking class",
category:"food",
tags:["food"],
capacity:30,
ticketType:"paid",
price:500
},

{
title:"Yoga Retreat",
description:"Morning yoga",
category:"health",
tags:["yoga"],
capacity:40,
ticketType:"free"
},

{
title:"Gaming Tournament",
description:"Valorant tournament",
category:"gaming",
tags:["gaming"],
capacity:120,
ticketType:"paid",
price:300
},

/* EXTRA EVENTS */

{
title:"Hackathon Ranchi",
description:"24 hour coding",
category:"tech",
tags:["hackathon"],
capacity:150,
ticketType:"free"
},

{
title:"Cricket League",
description:"Corporate cricket",
category:"sports",
tags:["cricket"],
capacity:200,
ticketType:"paid",
price:500
},

{
title:"Art Exhibition",
description:"Local artists",
category:"art",
tags:["art"],
capacity:80,
ticketType:"free"
},

{
title:"Business Seminar",
description:"Entrepreneurship",
category:"business",
tags:["business"],
capacity:100,
ticketType:"paid",
price:400
},

{
title:"Dance Competition",
description:"Dance battle",
category:"music",
tags:["dance"],
capacity:150,
ticketType:"paid",
price:300
},

{
title:"Python Workshop",
description:"Learn Python",
category:"education",
tags:["python"],
capacity:60,
ticketType:"free"
},

{
title:"Fitness Camp",
description:"Workout camp",
category:"health",
tags:["fitness"],
capacity:50,
ticketType:"free"
},

{
title:"Food Festival",
description:"Street food fest",
category:"food",
tags:["food"],
capacity:200,
ticketType:"paid",
price:250
},

{
title:"Startup Pitch Event",
description:"Pitch startups",
category:"business",
tags:["startup"],
capacity:80,
ticketType:"free"
},

{
title:"NextJS Conference",
description:"NextJS event",
category:"tech",
tags:["nextjs"],
capacity:120,
ticketType:"paid",
price:800
},

{
title:"Community Meetup",
description:"Community event",
category:"community",
tags:["community"],
capacity:70,
ticketType:"free"
},

{
title:"Esports Championship",
description:"Gaming event",
category:"gaming",
tags:["gaming"],
capacity:150,
ticketType:"paid",
price:600
},

{
title:"Meditation Camp",
description:"Meditation",
category:"health",
tags:["meditation"],
capacity:40,
ticketType:"free"
},

{
title:"Music Night",
description:"Live concert",
category:"music",
tags:["music"],
capacity:200,
ticketType:"paid",
price:700
},

{
title:"Coding Contest",
description:"Programming contest",
category:"tech",
tags:["coding"],
capacity:90,
ticketType:"free"
},

{
title:"Photography Walk",
description:"Photo walk",
category:"art",
tags:["photography"],
capacity:30,
ticketType:"paid",
price:200
},

{
title:"Startup Workshop",
description:"Startup training",
category:"business",
tags:["startup"],
capacity:60,
ticketType:"free"
},

{
title:"Tech Meetup",
description:"Developer meetup",
category:"tech",
tags:["developer"],
capacity:80,
ticketType:"free"
},

{
title:"Gaming LAN Party",
description:"LAN gaming",
category:"gaming",
tags:["gaming"],
capacity:100,
ticketType:"paid",
price:400
},

{
title:"Yoga Workshop",
description:"Yoga learning",
category:"health",
tags:["yoga"],
capacity:40,
ticketType:"free"
}

];

/* ======================================================
   Helpers
====================================================== */

function randomDate(): number {
return Date.now() + Math.floor(Math.random()*30)*86400000;
}

function endDate(start:number):number{
return start + 3*3600000;
}

function slug(title:string){
return title.toLowerCase().replace(/ /g,"-")+"-"+Date.now();
}

/* ======================================================
   Seed
====================================================== */

export const run = internalMutation({

handler:async(ctx)=>{

let organizer=await ctx.db.query("users").first();

if(!organizer){

const id=await ctx.db.insert("users",{

name:"EventHub Jharkhand",

email:"admin@test.com",

tokenIdentifier:"seed",

hasCompletedOnboarding:true,

freeEventsCreated:0,

createdAt:Date.now(),

updatedAt:Date.now()

});

organizer=await ctx.db.get(id);

}

let count=0;

for(let i=0;i<SAMPLE_EVENTS.length;i++){

const e=SAMPLE_EVENTS[i];

const loc=LOCATIONS[i%LOCATIONS.length];

const start=randomDate();

await ctx.db.insert("events",{

title:e.title,

description:e.description,

slug:slug(e.title),

organizerId:organizer!._id,

organizerName:organizer!.name,

category:e.category,

tags:e.tags,

startTime:start,

endTime:endDate(start),

timezone:"Asia/Kolkata",

locationType:"in-person",

venue:loc.venue,

address:loc.address,

city:loc.city,

state:loc.state,

country:"India",

capacity:e.capacity,

ticketType:e.ticketType,

price:e.price,

registrationCount:Math.floor(Math.random()*50),

coverImage:e.coverImage,

themeColor:e.themeColor,

createdAt:Date.now(),

updatedAt:Date.now()

});

count++;

}

return {success:true,count};

}

});

/* ======================================================
   Clear
====================================================== */

export const clear=internalMutation({

handler:async(ctx)=>{

const events=await ctx.db.query("events").collect();

for(const e of events){

await ctx.db.delete(e._id);

}

return {deleted:events.length};

}

});
