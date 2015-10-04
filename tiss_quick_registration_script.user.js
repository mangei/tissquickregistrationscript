// ==UserScript==
// @name       TISS Quick Registration Script
// @namespace  http://www.manuelgeier.com/
// @version    1.5.0
// @description  Script to help you to get into the group you want. Opens automatically the right panel, registers automatically and confirms your registration automatically. If you don't want the script to do everything automatically, the focus is already set on the right button, so you only need to confirm. There is also an option available to auto refresh the page, if the registration button is not available yet, so you can open the site and watch the script doing its work. You can also set a specific time when the script should reload the page and start.
// @match      https://tiss.tuwien.ac.at/*
// @copyright  2012+, Manuel Geier
// @require    http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

/*
 Changelog:

 v1.5.0 [04.10.2015]
 + allow to enter a study code, if you have multiple ones
 + add flags to en-/disable checks
 ~ Code cleanup

 v1.4 [07.09.2013]
 + show or hide logoutput on screen (option: showLog [true/false])
 + many improvements
 ~ Code refactoring

 v1.3 [01.03.2013]
 + Feature: automatically presses the Ok button at the final info page
 ~ Code refactoring

 v1.2 [27.02.2013]
 + Feature: ability to register to a LVA; just set 'isGroupRegistration' to 'false'
 + Feature: selected group label is now marked with light green
 ~ Bugfix/Quickfix: overflow in setTimeout causes an constant refresh of the page; now the page gets refreshed at least often if the specific start time is in the future

 v1.1
 + Feature: Let the script start at a specific time.

 v1.0 (2012)
 Initial release
 */

(function TissQuickRegistrationClass() {

    ///////////////////////////////////////////////////////////////////////
    // Configurate the script here
    //

    this.options = {
        // global option to enable or disable the script [true,false]
        scriptEnabled: true,

        // define here the type of registration [lva,group]
        registrationType: "lva",

        // name of you the group you want to join (only for registrationType 'group') [String]
        nameOfGroup: "Gruppe B",

        // checks if you are at the correct lva page
        lvaCheckEnabled: true,

        // only if the number is right, the script is enabled [String]
        lvaNumber: "360.173",

        // if you have multiple study codes, enter here the study code number you want
        // to register for eg. '123456' (no blanks). Otherwise leave empty. [String]
        studyCode: '',

        // autoGoToLVA: true,        // coming soon

        // checks if you are at the correct semester
        lvaSemesterCheckEnabled: true,

        // only if the semester is right, the script is enabled [String]
        lvaSemester: "2013W",

        // autoGoToSemester: true,   // coming soon

        // automatically opens the detail panel of a group [true,false]
        openPanel: false,

        // automatically presses the register button if it is available [true,false]
        autoRegister: true,

        // automatically presses the confirm button for your registration [true,false]
        autoConfirm: true,

        // continuously refresh the page until the script can register you [true,false]
        autoRefresh: false,

        // automatically presses the ok button on the confirmation info page [true,false]
        autoOkPressAtEnd: true,

        // a delay on the confirm info page, until the ok button gets pressed
        // this is useful if you want to continuously cycle through the registration process
        // until you are registered and with this parameter you can define a "cycle delay" at the end.
        // This could happen, if (for some reason) you are not on the whitelist for this course.
        // [Integer]
        okPressAtEndDelayInMs: 1000,

        // let the script start at a specific time [true,false]
        startAtSpecificTime: true,

        // define the specific time the script should start [Date]
        // new Date(year, month, day, hours, minutes, seconds, milliseconds)
        // note: months start with 0
        specificStartTime: new Date(2013, 8, 8, 09, 52, 30, 0),

        // if a specific time is defined, the script will refresh some ms sooner to adjust a delay [Integer]
        delayAdjustmentInMs: 300,

        // show log output of the script on screen [true,false]
        showLog: true
    };

    //
    // End of configuration
    ///////////////////////////////////////////////////////////////////////


    this.extendJQuery = function () {
        jQuery.fn.justtext = function () {
            return $(this).clone()
                .children()
                .remove()
                .end()
                .text().trim();
        };
    };

    this.tissQuickRegistration = function () {
        if (options.scriptEnabled) {
            pageLog("TISS Quick Registration Script enabled");
            pageLog("LVA Number: " + getLVANumber());
            pageLog("LVA Name: " + getLVAName());
            pageLog("Selected Tab: " + getSelectedTab());

            if (options.registrationType == "lva") {
                options.nameOfGroup = "LVA-Anmeldung";
            }

            // test if the lva and group exists
            if (!options.lvaCheckEnabled || doLvaCheck()) {
                if (!options.lvaSemesterCheckEnabled || doSemesterCheck()) {
                    var groupLabel = doGroupCheck();
                    if (groupLabel != null) {
                        highlight(groupLabel)
                    }
                }
            }

            if (options.startAtSpecificTime) {
                pageLog("Scripts starts at: " + getFormatedDate(options.specificStartTime));
                pageLog("Delay adjustment in ms: " + options.delayAdjustmentInMs);
                startTimer(options.specificStartTime.getTime() - options.delayAdjustmentInMs);
            } else {
                analysePage();
            }

        } else {
            pageLog("TISS Quick Registration Script disabled");
        }
    };

    this.startTimer = function (startTime) {
        var offset = startTime - new Date().getTime();
        if (offset > 0) {
            startRefreshTimer(startTime);
        } else {
            analysePage();
        }
    };

    this.startRefreshTimer = function (startTime) {
        printTimeToStart(startTime);

        var maxMillis = 2147483647;
        var offset = startTime - new Date().getTime();

        // prevent an overflow
        if (offset > maxMillis) {
            offset = maxMillis;
        }

        window.setTimeout(refreshPage, offset);
    };

    this.printTimeToStart = function (startTime) {
        var offset = (startTime - new Date().getTime()) / 1000;
        var out = "Refresh in: " + offset + " seconds";
        log(out);

        pageCountdown(out);

        window.setTimeout(function () {
            printTimeToStart(startTime);
        }, 1000);
    };

    this.refreshPage = function () {
        location.reload();
    };

    this.analysePage = function () {

        var tab = getSelectedTab();
        var confirmButton = getConfirmButton();
        var okButton = getOkButton();
        var studyCodeSelect = getStudyCodeSelect();

        log("tab: " + tab);
        log("confirmButton: " + confirmButton);
        log("okButton: " + okButton);

        if (tab == "LVA-Anmeldung") {
            onLVAPage();
        } else if (tab == "Gruppen") {
            onGroupPage();
        } else if (studyCodeSelect.length > 0) {
            onStudyCodeSelectPage();
        } else if (confirmButton.length > 0) {
            onConfirmPage();
        } else if (okButton.length > 0) {
            onConfirmInfoPage();
        }
    };

    this.getLVANumber = function () {
        return $("#contentInner h1 span:first").text().trim();
    };

    this.getLVAName = function () {
        return $("#contentInner h1").justtext();
    };

    this.getSemester = function () {
        return $("#contentInner h1 select").val();
    };

    this.getSelectedTab = function () {
        return $("li.ui-tabs-selected").text().trim();
    };

    this.getSubHeader = function () {
        return $("#contentInner #subHeader").text().trim();
    };

    this.onLVAPage = function () {
        onGroupPage()
    };

    this.onGroupPage = function () {
        if (options.lvaCheckEnabled && !doLvaCheck()) {
            return;
        }

        if (options.semesterCheckEnabled && !doSemesterCheck()) {
            return;
        }

        var groupLabel = doGroupCheck();
        if (groupLabel == null) {
            return;
        }
        highlight(groupLabel);

        var idAttr = groupLabel.parent().attr('id');
        log('idAttr: ' + idAttr);

        // get the id
        var id = idAttr.replace(/[^\d]/g, '');
        log('id: ' + id);

        // open the panel if the option is activated
        if (options.openPanel) {
            $("#toggleContent" + id).show();
            // for some reason, we have to wait some time here and try it again :/
            setTimeout(function () {
                $("#toggleContent" + id).show();
            }, 100);
        }

        // search for the registration button
        var regButton = getRegistrationButton(id);
        log('regButton: ' + regButton);


        // push the button
        if (regButton.length > 0) {

            highlight(regButton);
            regButton.focus();

            if (options.autoRegister) {
                regButton.click();
            }
        } else {
            if (getGroupCancelButton(id).length > 0) {
                pageOut('you are registered in group: ' + options.nameOfGroup);
            } else {
                // Only refresh the page if the option is set and if the registration is not yet completed.
                if (options.autoRefresh) {
                    refreshPage();
                }
                pageOut('no registration button found');
            }
        }
    };

    this.onStudyCodeSelectPage = function () {
        var studyCodeSelect = getStudyCodeSelect();
        var confirmButton = getConfirmButton();
        highlight(confirmButton);
        if (options.studyCode !== undefined && options.studyCode.length > 0) {
            setSelectValue(studyCodeSelect, options.studyCode);
        }
        confirmButton.focus();
        if (options.autoConfirm) {
            confirmButton.click();
        }
    };

    this.onConfirmPage = function () {
        var confirmButton = getConfirmButton();
        highlight(confirmButton);
        confirmButton.focus();
        if (options.autoConfirm) {
            confirmButton.click();
        }
    };

    this.onConfirmInfoPage = function () {
        var okButton = getOkButton();
        highlight(okButton);
        if (options.autoOkPressAtEnd) {
            setTimeout(function () {
                var okButton = getOkButton();
                okButton.click();
            }, options.okPressAtEndDelayInMs);
        }
    };

    this.pageOut = function (text) {
        var out = getOutputField();
        out.text(text);
    };

    this.pageCountdown = function (text) {
        var out = getCountdownField();
        out.text(text);
    };

    this.pageLog = function (text) {
        appendToLogField(text);
    };

    this.getOutputField = function () {
        var outputField = $("#TQRScriptOutput");
        if (outputField.length === 0) {
            injectOutputField();
            outputField = getOutputField();
        }
        return outputField;
    };

    this.getCountdownField = function () {
        var countdownField = $("#TQRScriptCountdown");
        if (countdownField.length === 0) {
            injectCountdownField();
            countdownField = getCountdownField();
        }
        return countdownField;
    };

    this.getLogField = function () {
        var logField = $("#TQRScriptLog");
        if (logField.length === 0) {
            injectLogField();
            logField = getLogField();
            options.showLog ? logField.show() : logField.hide()
        }
        return logField;
    };

    this.injectOutputField = function () {
        var el = $('#contentInner');
        var log = $('#TQRScriptLog');
        if (log.length) {
            el = log;
        }
        el.before('<div id="TQRScriptOutput" style="color: red; font-weight: bold; font-size: 14pt; padding: 8px 0px;"></div>');
    };

    this.injectCountdownField = function () {
        var el = $('#contentInner');
        var log = $('#TQRScriptLog');
        if (log.length) {
            el = log;
        }
        el.before('<div id="TQRScriptCountdown" style="color: blue; font-weight: bold; font-size: 14pt; padding: 8px 0px;"></div>');
    };

    this.injectLogField = function () {
        $("#contentInner").before('<div id="TQRScriptLog" style="color: black; background-color: #FFFCD9; font-size: 10pt;"><b>Information Log:</b></div>');
    };

    this.appendToLogField = function (text) {
        var log = getLogField();
        var newText = log.html() + "<br />" + text;
        log.html(newText);
    };

    this.getRegistrationButton = function (id) {
        var regButton;
        if (options.registrationType == "group") {
            regButton = $("#toggleContent" + id + " input:submit[value='Anmelden']");
            if (regButton.length == 0) {
                regButton = $("#toggleContent" + id + " input:submit[value='Voranmelden']");
                if (regButton.length == 0) {
                    regButton = $("#toggleContent" + id + " input:submit[value='Voranmeldung']");
                }
            }
        } else if (options.registrationType == "lva") {
            regButton = $("input:submit[value='Anmelden']");
        } else {
            pageLog("registrationType Error: unknown type '" + registrationType + "'");
        }
        return regButton;
    };

    this.getGroupCancelButton = function (id) {
        var unregButton = null;
        if (options.registrationType == "group") {
            unregButton = $("#toggleContent" + id + " input:submit[value='Abmelden']");
        } else if (options.registrationType == "lva") {
            unregButton = $("input:submit[value='Abmelden']").filter(function (index) {
                return $(this).attr("id") != 'registrationForm:confirmOkBtn';
            });
        } else {
            pageLog("registrationType Error: unknown type '" + registrationType + "'");
        }
        return unregButton;
    };

    this.getConfirmButton = function () {
        var confirmButton = $("form#regForm input:submit[value='Anmelden']");
        if (confirmButton.length == 0) {
            confirmButton = $("form#regForm input:submit[value='Voranmelden']");
            if (confirmButton.length == 0) {
                confirmButton = $("form#regForm input:submit[value='Voranmeldung']");
            }
        }
        return confirmButton;
    };

    this.getOkButton = function () {
        return $("form#confirmForm input:submit[value='Ok']");
    };

    this.getStudyCodeSelect = function () {
        return $("#regForm:studyCode");
    };

    this.getGroupLabel = function (nameOfGroup) {
        return $("span:contains('" + nameOfGroup + "')");
    };

    this.highlight = function (object) {
        object.css("background-color", "lightgreen");
    };

    this.isCorrectSemester = function () {
        return getSubHeader().contains(options)
    };

    this.setSelectValue = function ($element, value) {
        $element.find("option").removeAttr('selected');
        $element.find("option[value='" + value + "']").attr('selected', 'selected');
    };

    this.doGroupCheck = function () {
        var groupLabel = getGroupLabel(options.nameOfGroup);
        if (groupLabel.length == 0) {
            pageOut('group not found error: ' + options.nameOfGroup);
            return null;
        } else {
            return groupLabel;
        }
    };

    this.doLvaCheck = function () {
        var lvaNumber = getLVANumber();
        lvaNumber = lvaNumber.replace(/[^\d]/, '');
        var optionsLvaNumber = options.lvaNumber.replace(/[^\d]/, '');
        if (lvaNumber != optionsLvaNumber) {
            pageOut('wrong lva number error: expected: ' + optionsLvaNumber + ', got: ' + lvaNumber);
            return false;
        }
        return true;
    };

    this.doSemesterCheck = function () {
        var subheader = getSubHeader();
        if (subheader.indexOf(options.lvaSemester) === -1) {
            pageOut('wrong semester error: expected: ' + options.lvaSemester + ', got: ' + subheader.substring(0, 5));
            return false;
        }
        return true;
    };

    this.getFormatedDate = function (date) {
        return "" + date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
    };

    this.log = function (message) {
        console.log(message);
    };

    extendJQuery();
    tissQuickRegistration();

})();
