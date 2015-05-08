TISS Quick Registration Script
===========================
by [Manuel Geier](https://geier.io "Manuel Geier")


# What is it about?

It is always very hard to get into a limited group if many other students (>200) also try to get into the same group. You have to be faster than anyone else. It was always a very thrilling moment, when the registration slots got opened. And so the idea was born to to create a automatic script, lean back and watch it doing its job in a very relaxed way.

## A brief description of the script and its possibilities:

The UserScript helps you to get into the group you want on TISS fully automatically. It opens the right panel, registers and confirms your registration. If you don’t want the script to do everything automatically, the focus is already set on the right button, so you only need to confirm. There is also an option available to auto refresh the page, if the registration button is not available yet, so you can open the site and watch the script doing its work. You can also set a specific time when the script should reload the page and start.


## Requirements

* Google Chrome with [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo "Tampermonkey"), or
* Firefox with [Greasemonkey](https://addons.mozilla.org/de/firefox/addon/greasemonkey "Greasemonkey")


## Usage

1. Download the UserScript and install it to Tampermonkey/Greasemonkey.
1. Configure the script (see Configuration) to fulfill your requirements for a specific registration to a group.
1. Go to the specific LVA/Group registration webpage in TISS, where you want to register.
1. Enable the script.
1. Lean back and let the script do its job (it automatically starts if you entered a startdate (prefered) or refreshes the page continuously (see Configuration)).
1. Don’t forget to disable the UserScript if the  registration is done.


## Configuration

### enabled
```
var enabled = false;
```

enabled: Enable (true) and Disable (false) the whole script.

### isGroupRegistration

```
var isGroupRegistration = true;
```

isGroupRegistration: true = Group registration; false = LVA registration

### nameOfGroup

```
var nameOfGroup = 'Gruppe 8';
```

nameOfGroup: Name of the group you want to register. (needs only to be set, if it is ‘isGroupRegistration’ is set to ‘true’)

### openPanel

```
var openPanel = true;
```

openPanel: Opens automatically the right panel of the group on the website. Enabled (true) or disabled (false).

### autoRegister

```
var autoRegister = true;
```

autoRegister: Pushes automatically the button to register to the group. Enabled (true) or disabled (false).

### autoConfirm

```
var autoConfirm = true;
```

autoConfirm: Automatically confirms the registration. Enabled (true) or disabled (false).

### autoRefresh

```
var autoRefresh = true;
```

autoRefresh: Automatically refreshes your page if no register button is available (yet). Enabled (true) or disabled (false).

### startAtSpecificTime

```
var startAtSpecificTime = true;
```

startAtSpecificTime: Define if the page should automatically reload at a specific time. Enabled (true) or disabled (false).

### specificTime

```
var specificTime = new Date(2012, 8, 27, 09, 00, 00, 0).getTime();
```

specificTime: Defines the specific time.  
`new Date(year, month, day, hours, minutes, seconds, milliseconds);`  
(Month starts with 0: 0 = january, 1 = feb, etc.)


## Changelog

#### v1.4 [07.09.2013]

    + show or hide logoutput on screen (option: showLog [true/false])
    + many improvements
    ~ Code refactoring

#### v1.3 [01.03.2013]

    + Feature: automatically presses the Ok button at the final info page
    ~ Code refactoring

#### v1.2 [27.02.2013]

    + Feature: ability to register to a LVA; just set 'isGroupRegistration' to 'false'
    + Feature: selected group label is now marked with light green
    ~ Bugfix/Quickfix: overflow in setTimeout causes an constant refresh of the page; now the page gets refreshed at least often if the specific start time is in the future

#### v1.1

    + Feature: Let the script start at a specific time.

#### v1.0 (2012)

    Initial release