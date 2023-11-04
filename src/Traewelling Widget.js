// Trawelling Widget
// by tiuub (https://github.com/tiuub)

// GitHub - https://github.com/tiuub/traewelling-widget
// License - Apache 2.0


import Cache from './lib/cache';
import Updater from './lib/updater';
import * as http from './lib/http';

import Package from '../package.json';
const scriptVersion = Package.version;
const sourceRepoPath = extractGitHubRepoPath(Package.repository.url);
const sourceRepoUrl = `https://github.com/${sourceRepoPath}`
const scriptName = Package.name;
const scriptAuthor = Package.author;
const scriptLicense = Package.license;



// Defaults

const DEFAULT_USERNAME = "undefined";
// for debugging, place your api key here
const DEFAULT_API_KEY = "";
const DEFAULT_DAYS = 14;
const DEFAULT_DATE_STRING = ""; // could be something like "2023-09-01"
const DEFAULT_SCHEMES = {"small": [[[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"]]], [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "purposePersonal", "purposeCommute", "purposeBusiness"]]], [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "maxSpeed", "avgSpeed"]]], [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "categoryExpress", "categoryRegional", "categoryUrban"]]]], "large": [[[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"], ["moreStats", "minSpeed", "avgSpeed", "maxSpeed", "spacer", "purposePersonal", "purposeCommute", "purposeBusiness", "spacer", "favouriteStation"]], [["latestTrips"]]], [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"], ["moreStats", "categoryExpress", "categoryRegional", "categoryUrban", "spacer", "purposePersonal", "purposeCommute", "purposeBusiness", "spacer", "favouriteStation"]], [["longestTrips"]]], [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"], ["moreStats", "minSpeed", "avgSpeed", "maxSpeed", "spacer", "categoryExpress", "categoryRegional", "categoryUrban"]], [[{"name": "highestDelayTrips", "args": {"maxTrips": 3}}]], [[{"name": "fastestTrips", "args": {"maxTrips": 3}}]]]]};
const DEFAULT_WIDGET_FAMILY = "large";


const SPACING = 24;
const MAX_SPEED = 450; // to identifie errors in dataset


console.log(scriptName);
console.log(`by ${scriptAuthor}`);
console.log(`Version: ${scriptVersion}`);
console.log(`License: ${scriptLicense}`);
console.log(`GitHub: ${sourceRepoUrl}`);
console.log("");

// Helpers

const cache = new Cache(`${scriptName}Cache`, 2);
const updater = new Updater(sourceRepoPath);
const today = new Date();



// Check for updates

var areRepoUpdatesAvailable = false;
try {
  areRepoUpdatesAvailable = await updater.checkForUpdate(scriptVersion);
} catch (error) {
  console.log(`${error.line}: ${error.message}`);
}

// Update script

if (areRepoUpdatesAvailable) {
  try {
    await updater.updateScript(scriptName);
  } catch (error) {
    console.log(`${error.line}: ${error.message}`);
  }
}

// Set parameters

let widgetInputRAW = args.widgetParameter;

try {
  var widgetInput = widgetInputRAW.toString();

  var inputDict = JSON.parse(widgetInput);
} catch(e) {
  if (config.runsInWidget) {
    throw new Error("Please long press the widget and enter a paranerer.");
  }
}

let apiKey = DEFAULT_API_KEY;
if (config.runsInWidget) {
  apiKey = getParameterFromDict(inputDict, "apiKey");
}

let username = getParameterFromDictOrDefault(inputDict, "username", DEFAULT_USERNAME);
let days = getParameterFromDictOrDefault(inputDict, "days", DEFAULT_DAYS);
let dateString = getParameterFromDictOrDefault(inputDict, "date", DEFAULT_DATE_STRING);
let schemes = getParameterFromDictOrDefault(inputDict, "schemes", DEFAULT_SCHEMES);


// Transform dateString into days difference
// If dateString is valid, it will override the days parameter
if (isDateValid(dateString)) {
  let startDate = new Date(Date.parse(dateString) + today.getTimezoneOffset() * 60 * 1000);
    
  let deltaMilliseconds = today.getTime() - startDate.getTime();
  
  let diffInDays = Math.ceil(deltaMilliseconds / (1000*60*60*24));
  days = diffInDays;
}



// Create Widget

let widget = await createWidget();
if (!config.runsInWidget) {
  if (DEFAULT_WIDGET_FAMILY === "small") {
    await widget.presentSmall();
  } else if (DEFAULT_WIDGET_FAMILY === "medium") {
    await widget.presentMedium();
  } else if (DEFAULT_WIDGET_FAMILY === "large") {
    await widget.presentLarge();
  }
}

Script.setWidget(widget);

Script.complete();



// Build widget

async function createWidget() {
  let widget = new ListWidget();
  widget.backgroundColor = new Color("#811a0e");
  if (areRepoUpdatesAvailable)
    widget.url = sourceRepoUrl;
  else
    widget.url = `https://traewelling.de/@${username}`;
  
  let title = "🚆 Traewelling";
  if (areRepoUpdatesAvailable)
    title = "🔄 Traewelling";
  
  let subtitle = `undefined`;
  if (isDateValid(dateString)) {
    subtitle = `since ${dateString}`;
  } else {
    subtitle = `stats last ${days} days`;
  }
  
  let data = await getStatisticsDailyByDayDiff(apiKey, days);
  
  if (data === undefined) {
    await addTitle(widget, title);
    await addSubtitle(widget, "dataset could not be received!");
    
    return widget;
  }
  
  let trips = [];
  
  for (const [date, value] of Object.entries(data)) {
    trips.push(...value["statuses"]);
  }
  
  if (areRepoUpdatesAvailable)
    subtitle = "update available";
  
  let widgetFamily = config.widgetFamily;
  if (widgetFamily === undefined) {
    widgetFamily = DEFAULT_WIDGET_FAMILY;
  }
  
  let familySchemes = schemes[widgetFamily];
  
  let currentScheme = familySchemes[Math.floor(Math.random()*familySchemes.length)];
  
  let main = widget.addStack();
  main.layoutVertically();
  main.topAlignContent();
  main.setPadding(1, 1, 1, 1);
  
  let firstRow = true;
  for (let rowScheme of currentScheme) {
    if (firstRow) {
      firstRow = false;
    } else {
      main.addSpacer(SPACING);
    }
    let row = main.addStack();
    row.layoutHorizontally();
    row.topAlignContent();
    
    let rowSizer = row.addStack();
    rowSizer.layoutVertically();
    rowSizer.addSpacer();
    
    let firstColumn = true;
    for (let columnScheme of rowScheme) {
      if (firstColumn) {
        firstColumn = false;
      } else {
        row.addSpacer(SPACING);
      }
      
      let column = row.addStack();
      column.layoutVertically();
      column.topAlignContent();
      
      let columnSizer = column.addStack();
      columnSizer.layoutHorizontally();
      columnSizer.addSpacer();
      
      let noSpacerOnNext = true;
      for (let entry of columnScheme) {
        let entryLower = "";
        let entryArgs = undefined;
        if (!(entry.constructor == Object)) {
          entryLower = entry.toLowerCase();
        } else {
          entryLower = entry.name.toLowerCase();
          entryArgs = entry.args;
        }
              
        if (noSpacerOnNext || entryLower.endsWith("spacer")) {
          noSpacerOnNext = false;
        } else {
           column.addSpacer(3);
        }
        
        if (entryLower === "spacer") {
          column.addSpacer();
        } else if (entryLower === "smallspacer") {
          column.addSpacer(3);
        } else if (entryLower === "mediumspacer") {
          column.addSpacer(9);
        } else if (entryLower === "bigspacer") {
          column.addSpacer(18);
        } else if (entryLower === "nospacer") {
          noSpacerOnNext = true;
        } else if (entryLower === "title") {
          await addTitle(column, title);
        } else if (entryLower === "morestats") {
          await addTitle(column, "More Statistics");
        } else if (entryLower === "subtitle") {
          await addSubtitle(column, subtitle);
        } else if (entryLower === "distance") {
          await addTrainDistance(column, data);
        } else if (entryLower === "duration") {
          await addTrainDuration(column, data);
        } else if (entryLower === "stations") {
          await addStationsCount(column, data);
        } else if (entryLower === "favouritestation") {
          await addFavouriteStation(column, data);
        } else if (entryLower === "delay") {
          await addTrainDelay(column, data);
        } else if (entryLower === "minspeed") {
          await addTrainMinSpeed(column, data);
        } else if (entryLower === "maxspeed") {
          await addTrainMaxSpeed(column, data);
        } else if (entryLower === "avgspeed") {
          await addTrainAvgSpeed(column, data);
        } else if (entryLower === "purposepersonal") {
          await addTripPurpose(column, trips, 0);
        } else if (entryLower === "purposecommute") {
          await addTripPurpose(column, trips, 2);
        } else if (entryLower === "purposebusiness") {
          await addTripPurpose(column, trips, 1);
        } else if (entryLower === "categoryexpress") {
          await addTrainCategory(column, trips);
        } else if (entryLower === "categoryregional") {
          await addTrainCategory(column, trips, "regional");
        } else if (entryLower === "categoryurban") {
          await addTrainCategory(column, trips, "urban");
        } else if (entryLower === "latesttrips") {
          await addLatestTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "fastesttrips") {
          await addFastestTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "slowesttrips") {
          await addSlowestTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "longesttrips") {
          await addLongestTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "shortesttrips") {
          await addShortestTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "longesttimetrips") {
          await addLongestTimeTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "shortesttimetrips") {
          await addShortestTimeTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        } else if (entryLower === "highestdelaytrips") {
          await addHighestDelayTrips(column, trips, ...Object.values(entryArgs||{"maxTrips": 7}));
        }
      }
    }
  }
  
  return widget;
}

async function addTitle(widget, title) {
  let t_title = widget.addText(title);
  t_title.font = Font.boldSystemFont(12);
  t_title.textColor  = Color.white();
  
  return widget;
}

async function addSubtitle(widget, subtitle) {
  let t_subtitle = widget.addText(subtitle);
  t_subtitle.font = Font.regularSystemFont(12);
  t_subtitle.textColor  = Color.white();
  
  return widget;
}

async function addTrainDistance(widget, data) {
  let totalDistances = {};
  
  for (const [date, value] of Object.entries(data)) {
    totalDistances[date] = value["totalDistance"];
  }

  let trainDistance = sum(Object.values(totalDistances));
  let trainDistanceInKm = trainDistance / 1000;
  
  let t_distance = widget.addText(`${numberWithCommas(trainDistanceInKm, 0)} km`);
  t_distance.font = Font.boldSystemFont(18);
  t_distance.textColor = Color.white();
  
  let t1_distance = widget.addText("total distance");
  t1_distance.font = Font.boldSystemFont(12);
  t1_distance.textColor  = Color.white();
  
  return widget;
}

async function addTrainDuration(widget, data) {
  let totalDurations = {};
  
  for (const [date, value] of Object.entries(data)) {
    totalDurations[date] = value["totalDuration"];
  }
  
  let trainDuration = sum(Object.values(totalDurations));
  
  let trainDurationHoursMinutes = toHoursAndMinutes(trainDuration);
  let trainDurationHours = trainDurationHoursMinutes["hours"];
  let trainDurationMinutes = trainDurationHoursMinutes["minutes"];
  
  let t_duration = widget.addText(`⏱️ ${trainDurationHours}h ${trainDurationMinutes}min`);
  t_duration.font = Font.regularSystemFont(12);
  t_duration.textColor = Color.white();
  
  return widget;
}

async function addStationsCount(widget, data) {
  let trainstations = [];
  
  for (const [date, value] of Object.entries(data)) {
    for (const status of value["statuses"]) {
      let train = status["train"];
      let origin = train["origin"];
      let destination = train["destination"];
        
      let originEva = origin["evaIdentifier"];
      let destinationEva = destination["evaIdentifier"];
        
      if (!trainstations.includes(originEva)) {
        trainstations.push(originEva);
      }
      
      if (!trainstations.includes(destinationEva)) {
        trainstations.push(destinationEva);
      }
    }
  }
  
  let t_trainstations = widget.addText(`🏫 ${trainstations.length} stations`);
  t_trainstations.font = Font.regularSystemFont(12);
  t_trainstations.textColor = Color.white();
  
  return widget;
}

async function addFavouriteStation(widget, data) {
  let stationCount = {};
  let evaToNames = {};
  
  for (const [date, value] of Object.entries(data)) {
    for (const status of value["statuses"]) {
      let train = status["train"];
      let origin = train["origin"];
      let destination = train["destination"];
        
      let originEva = origin["evaIdentifier"];
      let originName = origin["name"];
      let destinationEva = destination["evaIdentifier"];
      let destinationName = destination["name"];
        
      if (!(originEva in stationCount)) {
        evaToNames[originEva] = originName;
        stationCount[originEva] = 1;
      }else{
        stationCount[originEva] += 1;
      }
      
      if (!(destinationEva in stationCount)) {
        evaToNames[destinationEva] = destinationName;
        stationCount[destinationEva] = 1;
      }else{
        stationCount[destinationEva] += 1;
      }
    }
  }
  
  let highestEva = Object.keys(stationCount).reduce(function(a, b){ return stationCount[a] > stationCount[b] ? a : b });

  let t_favouritestation = widget.addText(`⭐️ ${evaToNames[highestEva]} (${stationCount[highestEva]})`);
  t_favouritestation.font = Font.regularSystemFont(12);
  t_favouritestation.textColor = Color.white();
  
  return widget;
}

async function addTrainDelay(widget, data) {
  let delays = {};
  
  for (const [date, value] of Object.entries(data)) {
    for (const status of value["statuses"]) {
      let train = status["train"];
      
      let arrivalPlanned = new Date(train["destination"]["arrivalPlanned"]);
      let arrivalRealString = train["destination"]["arrivalReal"];
      let overriddenArrivalString = train["overriddenArrival"];
        
      if (overriddenArrivalString !== null) {
        let overriddenArrival = new Date(overriddenArrivalString);
        delays[date] = (overriddenArrival - arrivalPlanned) / 60000;
      } else if (arrivalRealString !== null) {
        let arrivalReal = new Date(arrivalRealString);
        delays[date] = (arrivalReal - arrivalPlanned) / 60000;
      }
    }
  }
  
  let trainDelay = sum(Object.values(delays));
  
  let trainDelayHoursMinutes = toHoursAndMinutes(trainDelay);
  let trainDelayHours = trainDelayHoursMinutes["hours"];
  let trainDelayMinutes = trainDelayHoursMinutes["minutes"];
  
  let t_delay = widget.addText(`⏳ ${trainDelayHours}h ${trainDelayMinutes}min delay`);
  t_delay.font = Font.regularSystemFont(12);
  t_delay.textColor = Color.white();
  
  return widget;
}

async function addTrainMinSpeed(widget, data) {
  return addTrainMinMaxSpeed(widget, data, false);
}

async function addTrainMaxSpeed(widget, data) {
  return addTrainMinMaxSpeed(widget, data, true);
}

async function addTrainMinMaxSpeed(widget, data, max=true) {
  let maxSpeed = 0;
  let minSpeed = 999999;
  
  for (const [date, value] of Object.entries(data)) {
    for (const status of value["statuses"]) {
        let train = status["train"];
        let speed = train["speed"];
        
        if (speed < minSpeed) {
          minSpeed = speed;
        }
        
        if (speed > maxSpeed && speed < MAX_SPEED) {
          maxSpeed = speed;
        }
    }
  }
  
  let t_minmaxspeed = undefined
  if (max) {
    t_minmaxspeed = widget.addText(`🚄 ${numberWithCommas(maxSpeed, 0)} km/h (max)`);
  } else {
    t_minmaxspeed = widget.addText(`🚄 ${numberWithCommas(minSpeed, 0)} km/h (min)`);
  }
  
  t_minmaxspeed.font = Font.regularSystemFont(12);
  t_minmaxspeed.textColor = Color.white();
  
  return widget;
}

async function addTrainAvgSpeed(widget, data) {
  let speedsDurations = [];
  
  for (const [date, value] of Object.entries(data)) {
    
    for (const status of value["statuses"]) {
        let train = status["train"];
        let speed = train["speed"];
        let duration = train["duration"] / 60;
        
        if (speed < MAX_SPEED) {
          speedsDurations.push({"speed": speed, "duration": duration});
        }
    }
  }
  
  
  let sumDurations = sum(speedsDurations.map(dict => dict["duration"]));
  let trainAvgSpeed = 0;
  for (const dict of speedsDurations) {
    let factor = dict["duration"] / sumDurations;
    trainAvgSpeed += dict["speed"] * factor;
  }
  
  let t_avgspeed = widget.addText(`🚄 ${numberWithCommas(trainAvgSpeed, 0)} km/h (avg)`);
  t_avgspeed.font = Font.regularSystemFont(12);
  t_avgspeed.textColor = Color.white();
  
  return widget;
}

async function addTripPurpose(widget, trips, purpose=0) {
  let displayFunc = function(percentages) {
    return `${purpose_emoji(purpose)} ${numberWithCommas(percentages[purpose], 0)}% ${purpose_name(purpose)}`;
  };

  await addPercentageByDuration(widget, trips, "business", displayFunc);
}

// categories: express, regional, urban
async function addTrainCategory(widget, trips, category="express") {
  let categories = {
    "express" : ["national", "nationalExpress"],
    "regional" : ["regional", "regionalExp"],
    "urban" : ["tram", "bus", "suburban", "subway", "ferry"]
  };
  
  let categoryEmojies = {
    "express" : train_emoji("nationalExpress"),
    "regional": train_emoji("regional"),
    "urban": train_emoji("tram")
  };

  let categoryEmoji = categoryEmojies[category];
  
  let displayFunc = function(percentages) {
    let percentage = categories[category].reduce((total, c) => (percentages[c] || 0) + total, 0);
    return `${categoryEmoji} ${numberWithCommas(percentage, 0)}% ${category}`;
  };
  
  await addPercentageByDuration(widget, trips, "train.category", displayFunc);
}

async function addPercentageByDuration(widget, trips, key, displayFunc) {
  let keys = key.split(".");
  let targetKey = keys.pop();
  let data = {};
  
  for (let i = 0; i < trips.length; i++) {
    let current = trips[i];
    for (let k = 0; k < keys.length; ++k) {
      current = current[keys[k]];
      if (!current) {
        throw new Error('Specified key not found. ' + keys[k]);
      }
    }
    
    let duration = trips[i]["train"]["duration"];
    let val = current[targetKey];
    
    if (!(val in data)) {
      data[val] = duration;
    } else {
      data[val] += duration;
    }
  }
  
  let total = 0;
  for (var i in data) { 
      total += data[i];
  }

  let percentages = {};
  for (var i in data) {
    percentages[i] = (data[i] / total * 100);
  }
  
  let t_purpose = widget.addText(displayFunc(percentages));
  t_purpose.font = Font.regularSystemFont(12);
  t_purpose.textColor = Color.white();
  
  return widget;
}

async function addLatestTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => b.train.origin.departure - a.train.origin.departure);
  
  await addRecordTrips(widget, "Latest Trips", trips, maxTrips);
}

async function addFastestTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => b.train.speed - a.train.speed);
  
  trips = trips.filter(trip => trip.train.speed < MAX_SPEED);
  
  let displayFunc = function(trip) { 
    return `(${numberWithCommas(trip.train.speed, 0)} km/h)`;
  };
  
  await addRecordTrips(widget, "Fastest Trips", trips, maxTrips, displayFunc);
}

async function addSlowestTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => a.train.speed - b.train.speed);
  
  let displayFunc = function(trip) { 
    return `(${numberWithCommas(trip.train.speed, 0)} km/h)`;
  };
  
  await addRecordTrips(widget, "Slowest Trips", trips, maxTrips, displayFunc);
}

async function addLongestTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => b.train.distance - a.train.distance);
  
  await addRecordTrips(widget, "Longest Trips", trips, maxTrips);
}

async function addShortestTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => a.train.distance - b.train.distance);
  
  await addRecordTrips(widget, "Shortest Trips", trips, maxTrips);
}

async function addLongestTimeTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => b.train.duration - a.train.duration);
  
  let displayFunc = function(trip) { 
    return `(${minutesToHoursMinutesString(trip.train.duration)})`;
  };
  
  await addRecordTrips(widget, "Longest Time Trips", trips, maxTrips, displayFunc);
}

async function addShortestTimeTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => a.train.duration - b.train.duration);
  
  let displayFunc = function(trip) { 
    return `(${minutesToHoursMinutesString(trip.train.duration)})`; 
  };
  
  await addRecordTrips(widget, "Shortest Time Trips", trips, maxTrips, displayFunc);
}

async function addHighestDelayTrips(widget, trips, maxTrips=7) {
  trips.sort((a, b) => (new Date(b.train.destination.arrivalReal) -  new Date(b.train.destination.arrivalPlanned)) - (new Date(a.train.destination.arrivalReal) -  new Date(a.train.destination.arrivalPlanned)));
  
  let displayFunc = function(trip) { 
    return `(${minutesToHoursMinutesString((new Date(trip.train.destination.arrivalReal) - new Date(trip.train.destination.arrivalPlanned)) / 60000)})`;
  };
  
  await addRecordTrips(widget, "Highest Delay Trips", trips, maxTrips, displayFunc);
}

async function addRecordTrips(widget, title, trips, maxTrips=7, displayParameterFunc= (function() { return ""; })) {
  let t_title = widget.addText(title);
  t_title.font = Font.boldSystemFont(12);
  t_title.textColor  = Color.white();
  
  if (trips.length <= 0) {
    widget.addSpacer(3);
    
    let t_trip = widget.addText("😿 No trips");
    t_trip.font = Font.regularSystemFont(12);
    t_trip.textColor = Color.white();
    return;
  }
  
  let l = trips.length;
  if (l > maxTrips) {
    l = maxTrips;
  }
  
  for (let i = 0; i < l; i++) {
    let trip = trips[i];
    let purpose = trip["business"];
    let trainCategory = trip["train"]["category"];
    let trainDistance = trip["train"]["distance"];
    let trainDistanceInKm = (trainDistance/1000);
    let trainOriginName = trip["train"]["origin"]["name"];
    let trainDestinationName = trip["train"]["destination"]["name"];
    
    let displayParameter = displayParameterFunc(trip);
    
    let purposeEmoji = purpose_emoji(purpose);
    if (purpose_name(purpose) === "personal") {
      purposeEmoji = "";
    }
    
    widget.addSpacer(3);
    
    let t_trip = widget.addText(`${train_emoji(trainCategory)} ${displayParameter} ${trainOriginName} to ${trainDestinationName} ~ ${numberWithCommas(trainDistanceInKm, 0)} km ${purposeEmoji}`);
    t_trip.font = Font.regularSystemFont(12);
    t_trip.textColor = Color.white();
  }
}

function extractGitHubRepoPath(url) {
  if (!url) return null;
  const match = url.match(
    /^(git\+)?https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w-]+)(\.git)?/
  );
  if (!match || !(match.groups?.owner && match.groups?.name)) return null;
  return `${match.groups.owner}/${match.groups.name}`;
}

async function getStatisticsDailyByDayDiff(apiKey, days=7) {
  let data = {};
  for (let i = 0; i < days; i++) { 
    var date = new Date();
    date.setDate(today.getDate() - i);
    
    let cacheExpiration = Math.floor(i/3)*24*60;
    if (cacheExpiration > 90*24*60) {
      cacheExpiration = 90*24*60;
    }
    
    let j = await loadStatisticsDaily(apiKey, date, cacheExpiration);
    
    let dateString = toDateString(date);
    
    if (j === undefined) {
      return undefined;
    }
    
    if (j.hasOwnProperty("data")) {
      let d = j["data"];
      d.statuses.reverse();
      data[dateString] = d;
    }
  }
  return data;
}

async function loadStatisticsDaily(apiKey, date, cacheExpiration=0) {
  let dateString = toDateString(date);
  
  console.log(`Fetching daily stats, apiKey: ***, date: ${dateString}, cacheExpiration: ${cacheExpiration}m`);
  let url = `https://traewelling.de/api/v1/statistics/daily/${dateString}`;
  let headers = {"Authorization": "Bearer " + apiKey};
  let json = await http.fetchJson({
      url,
      headers,
      cache,
      cacheKey: `traewelling_personal_${username}_${dateString}`,
      cacheExpiration
  });
  return json;
}

function zeroPad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function numberWithCommas(x, decimals=2) {
  x = x.toFixed(decimals);
  var parts = x.toString().split(".");
  parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");
  return parts.join(",");
}

function getParameterFromDict(dict, key) {
  if (!(key in dict)) {
    throw new Error(`Cannot find "${key}" in dict, but is required!`);
  }
  return dict[key];
}

function getParameterFromDictOrDefault(dict, key, defaultVal) {
  try {
    return getParameterFromDict(dict, key);
  } catch(e) {
    return defaultVal;
  }
}

function toDateString(date) {
  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();
  
  let dateString = `${year}-${zeroPad(month+1, 2)}-${zeroPad(day, 2)}`;
  
  return dateString;
}

function toHoursAndMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);

  return { hours, minutes };
}

function minutesToHoursMinutesString(totalMinutes) {
  let hoursminutes = toHoursAndMinutes(totalMinutes);
  
  return `${hoursminutes["hours"]}h ${hoursminutes["minutes"]}m`;
}

function sum(arr) {
  if(!Array.isArray(arr)) return;
  return arr.reduce((a, v)=>a + v);
}

function average(numbers) {
  // Calculate the sum of the numbers in the array
  let sum = numbers.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);

  // Divide the sum by the total number of elements in the array
  let avg = sum / numbers.length;

  // Return the average
  return avg;
}

function isDateValid(dateStr) {
  return !isNaN(new Date(dateStr));
}

function train_emoji(category) {
  let emojis = {"regional": "🚆", "regionalExp": "🚆", "national": "🚅", "nationalExpress": "🚅", "tram": "🚃", "bus": "🚌", "subway": "🚇", "suburban": "🚋", "ferry": "⛴️"};
  
  if (emojis[category] !== undefined) {
    return emojis[category];
  }else{
    return "🚂";
  }
}

function purpose_emoji(purpose) {
  let emojiByPurpose = {0: "👤", 1: "💼", 2: "🏢"};
  
  return emojiByPurpose[purpose];
}

function purpose_name(purpose) {
  let nameByPurpose = {0: "personal", 1: "business", 2: "commute"};
  
  return nameByPurpose[purpose];
}