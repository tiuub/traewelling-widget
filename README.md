# Traewelling Widget
[![Latest Release](https://img.shields.io/github/v/release/tiuub/traewelling-widget)](https://github.com/tiuub/traewelling-widget/releases/latest)
[![GitHub All Releases](https://img.shields.io/github/downloads/tiuub/traewelling-widget/total)](https://github.com/tiuub/traewelling-widget/releases/latest)
[![Issues](https://img.shields.io/github/issues/tiuub/traewelling-widget)](https://github.com/tiuub/traewelling-widget/issues)
[![GitHub](https://img.shields.io/github/license/tiuub/traewelling-widget)](https://github.com/tiuub/traewelling-widget/blob/master/LICENSE)
![GitHub Sponsors](https://img.shields.io/github/sponsors/tiuub)


Traewelling Widget is a iOS widget for [Scriptable](https://scriptable.app/), which shows some stats about your logged train rides on [Traewelling](https://traewelling.de).


## Installation

 - Download [Scriptable](https://scriptable.app/) from the [App Store](https://apps.apple.com/de/app/scriptable/id1405459188)
 - Download the latest release [here](https://github.com/tiuub/traewelling-widget/releases/latest).
 - Copy the TraewellingWidget.js to your Scriptable folder in Files.


### Configure Widget

 - Long press anywhere on your Homescreen and click on the **+**
 - Search for **Scriptable**, select the formfactor you want to have and place it wherever you want
 - Long press the widget and click on **Edit Widget**
 - Select **TraewellingWidget**, set *When interacting* to **Run Script** and paste your configuration JSON at **Parameter**. (For configuration, see below)


### Authorization

- After configuration, the widget should state something like *this profile is unauthenticated*
- Remember your profile you have set in the configuration and click on the widget
- Follow the steps of the authorization flow
- When the Scriptable App opens again, enter your profile and confirm with **Ok**
- You should be authenticated now

*(Hint: If you have configured a bigger timespan, f.e. more than 14 days in the past, the script might timeout a few times at first start. This should fix by itself. This happens due to iOS widget timeout limitations. It will work after the script has cached some statistics.)*

## Configuration

This is a bare minimum default configuration, you can use for your widget.
The profile parameter is optional, but recommended. If not set, it will use **0** by default.

*(The widget will then use the latest 14 days of your Traewelling data by default.)*

```json
{
    "profile": "<profile>"
}
```

### Default Configuration (Date Difference)

If you want to see more than the latest 14 days of your Traewelling data, you can set these through the configuration. In this example, you will get the latest 28 days.

```json
{
    "days": 28,
}
```

### Default Configuration (Specific Date)

If you want to see all your Traewelling data to a specific date, you can set these through the configuration.

```json
{
    "date": "2023-10-01",
}
```

### Default Configuration (Custom Schemes)

If you want to use a custom scheme for your widget, you can set this through the configuration.

```json
{
    "schemes": {
        "small": [
            [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"]]], 
            [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "purposePersonal", "purposeCommute", "purposeBusiness"]]],
        ], 
        "large": [
            [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"], ["moreStats", "minSpeed", "avgSpeed", "maxSpeed", "spacer", "purposePersonal", "purposeCommute", "purposeBusiness", "spacer", "favouriteStation"]], [["latestTrips"]]],
            [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"], ["moreStats", "categoryExpress", "categoryRegional", "categoryUrban", "spacer", "purposePersonal", "purposeCommute", "purposeBusiness", "spacer", "favouriteStation"]], [["longestTrips"]]],
            [[["title", "noSpacer", "subtitle", "spacer", "distance", "spacer", "duration", "stations", "delay"], ["moreStats", "minSpeed", "avgSpeed", "maxSpeed", "spacer", "categoryExpress", "categoryRegional", "categoryUrban"]], [[{"name": "highestDelayTrips", "args": {"maxTrips": 3}}]], [[{"name": "fastestTrips", "args": {"maxTrips": 3}}]]]
        ]
    }
}
```

## Scheme Documentation

If you want to use a custom scheme for your widget, you can do so, by modifying the scheme in your configuration.

