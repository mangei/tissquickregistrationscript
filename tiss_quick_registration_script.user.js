// ==UserScript==
// @name       TISS Quick Registration Script
// @namespace  http://www.manuelgeier.com/
// @version    1.6.4
// @description  Script to help you to get into the group you want. Opens automatically the right panel, registers automatically and confirms your registration automatically. If you don't want the script to do everything automatically, the focus is already set on the right button, so you only need to confirm. There is also an option available to auto refresh the page, if the registration button is not available yet, so you can open the site and watch the script doing its work. You can also set a specific time when the script should reload the page and start.
// @match      https://tiss.tuwien.ac.at/*
// @copyright  2012+, Manuel Geier, THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// @require    http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

/*
 Changelog:

  v.1.6.4 [23.01.2024]
 + Added: autoGoToLVA support
 + Added: autoGoToSemester support
 (Greetings ~ Tobia5H :) )
 
 v.1.6.3 [18.12.2020]
 + Added: date of exam support

 v.1.6.2 [09.01.2020]
 + Improve countdown format (Thanks @Heholord, #14)

 v.1.6.1 [13.10.2019]
 ~ Fix: Ignore multiple spaces on group label comparison. (@zarmonious, #13)

 v.1.6.0 [28.11.2018]
 + Added: exam-registration support (Thanks to @XtomtomX, #11)

 v1.5.3 [29.02.2016]
 ~ Added: .gitignore
 ~ Fix: missing reference to 'options' object
 ~ Fix: wrong option name ('semesterCheckEnabled' instead of 'lvaSemesterCheckEnabled')
 ~ String/Number compare with === instead of ==, and !== instead of !=
 ~ Fix #9: id no longer available for wrapper element. replace it by element itself and adjust selectors.
 ~ Fix: toggle for groups (now without id selector)
 ~ Fix: group name selector now matches the exact name and not only if it contains the name

 v1.5.2 [?]
 - went missing :P

 v1.5.1 [09.10.2015]
 ~ Fix: adjusts group label selector
 ~ Fix: Remove leading zero for month which leads to unintended octal interpretation

 v1.5 [04.10.2015]
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
    var self = this;

    ///////////////////////////////////////////////////////////////////////
    // Configurate the script here
    //

    var options = {
        // global option to enable or disable the script [true,false]
        scriptEnabled: true,

        // define here the type of registration [lva,group,exam]
        registrationType: "group",

        // name of you the group you want to join (only for registrationType 'group') [String]
        nameOfGroup: "Gruppe 001",

        // name of the exam which you want to join (only for registrationType 'exam') [String]
        nameOfExam: "Name Of Exam",

        // date of the exam which you want to join, especially when there are multiple exams with the same name (only for registrationType 'exam') [String]
        dateOfExam: '',

        // checks if you are at the correct lva page
        lvaCheckEnabled: true,

        // only if the number is right, the script is enabled [String]
        lvaNumber: "123.456",

        // if you have multiple study codes, enter here the study code number you want
        // to register for eg. '123456' (no blanks). Otherwise leave empty. [String]
        studyCode: '',

	// If you want to navigate automatically to the latest LVA-MAIN page, set this option to true.
	// You need to set 'lvaNumber'!
        autoGoToLVA: false,

        // checks if you are at the correct semester
        lvaSemesterCheckEnabled: true,

        // only if the semester is right, the script is enabled [String]
        lvaSemester: "2023W",

	// If you want to navigate automatically to the LVA/Exam/Group/page with the specified Semester, set this option to true.
	// You need to set 'lvaNumber' and 'lvaSemester'!
        autoGoToSemester: false,  

        // automatically opens the detail panel of a group [true,false]
        openPanel: true,

        // automatically presses the register button if it is available [true,false]
        autoRegister: true,

        // automatically presses the confirm button for your registration [true,false]
        autoConfirm: true,

        // continuously refresh the page until the script can register you [true,false]
        autoRefresh: true,

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
        specificStartTime: new Date(2020, 1 - 1, 9, 20, 27, 0, 0),

        // if a specific time is defined, the script will refresh some ms sooner to adjust a delay [Integer]
        delayAdjustmentInMs: 300,

        // show log output of the script on screen [true,false]
        showLog: true
    };

    //
    // End of configuration
    ///////////////////////////////////////////////////////////////////////


    self.init = function () {
        self.extendJQuery();
        self.tissQuickRegistration();
    };

    self.extendJQuery = function () {
        jQuery.fn.justtext = function () {
            return $(this).clone()
                .children()
                .remove()
                .end()
                .text().trim();
        };
    };

    self.tissQuickRegistration = function () {
        if (options.scriptEnabled) {
          	if (options.autoGoToLVA && options.autoGoToSemester) {
              	// Check if options.lvaNumber and options.lvaSemester are set
                alert("Option 'autoGoToLVA' and 'autoGoToSemester' are both set to 'true'.\nPlease set at least one of them to 'false'.");
                console.error("Option 'autoGoToLVA' and 'autoGoToSemester' are both set to 'true'. Please set at least one of them to 'false'.");
            } 
          
            if (options.autoGoToLVA && !options.autoGoToSemester) {
              	// Check if options.lvaNumber and options.lvaSemester are set
                if (!options.lvaNumber) {
                  	alert("Option 'lvaNumber' must be set for navigation.");
                    console.error("Options 'lvaNumber' must be set for navigation.");
                    return;
                } else {
            			self.navigateToLVA();
                }
            } 
          
          	if (options.autoGoToSemester && !options.autoGoToLVA) {
              	// Check if options.lvaNumber and options.lvaSemester are set
                if (!options.lvaNumber || !options.lvaSemester) {
                    alert("Options 'lvaNumber' and 'lvaSemester' must be set for navigation.");
                    console.error("Options 'lvaNumber' and 'lvaSemester' must be set for navigation.");
                    return;
                } else {
            			self.navigateToSemester();
                }
            }
          
            self.pageLog("TISS Quick Registration Script enabled");
            self.pageLog("LVA Number: " + self.getLVANumber());
            self.pageLog("LVA Name: " + self.getLVAName());
            self.pageLog("Selected Tab: " + self.getSelectedTab());

            if (options.registrationType === "lva") {
                options.nameOfGroup = "LVA-Anmeldung";
            }

            // test if the lva and group exists
            if (!options.lvaCheckEnabled || self.doLvaCheck()) {
                if (!options.lvaSemesterCheckEnabled || self.doSemesterCheck()) {
                    if (options.registrationType !== "exam") { // own code
                        var groupLabel = self.doGroupCheck();
                        if (groupLabel !== null) {
                            self.highlight(groupLabel);
                        }
                    } else {
                        var examLabel = self.doExamCheck();
                        if (examLabel !== null) {
                            self.highlight(examLabel);
                            self.pageLog("Prüfung: " + examLabel.text().trim());
                        }
                    }
                }
            }

            if (options.startAtSpecificTime) {
                self.pageLog("Scripts starts at: " + self.getFormatedDate(options.specificStartTime));
                self.pageLog("Delay adjustment in ms: " + options.delayAdjustmentInMs);
                self.startTimer(options.specificStartTime.getTime() - options.delayAdjustmentInMs);
            } else {
                self.analysePage();
            }

        } else {
            self.pageLog("TISS Quick Registration Script disabled");
        }
    };

    self.startTimer = function (startTime) {
        var offset = startTime - new Date().getTime();
        if (offset > 0) {
            self.startRefreshTimer(startTime);
        } else {
            self.analysePage();
        }
    };

    self.startRefreshTimer = function (startTime) {
        self.printTimeToStart(startTime);

        var maxMillis = 2147483647;
        var offset = startTime - new Date().getTime();

        // prevent an overflow
        if (offset > maxMillis) {
            offset = maxMillis;
        }

        window.setTimeout(self.refreshPage, offset);
    };

    self.printTimeToStart = function (startTime) {
        var offset = (startTime - new Date().getTime()) / 1000;
        var out = "Refresh in: ";
        var minutes = offset / 60;
        if (minutes > 1) {
            var hours = minutes / 60;
            if (hours > 1) {
                out += Math.floor(hours) + " hours, "
                minutes = minutes % 60;
            }
            out += Math.floor(minutes) + " minutes and ";
        }
        var seconds = offset % 60;
        out += Math.floor(seconds) + " seconds";
        self.log(out);

        self.pageCountdown(out);

        window.setTimeout(function () {
            self.printTimeToStart(startTime);
        }, 1000);
    };

    self.refreshPage = function () {
        location.reload();
    };

    self.analysePage = function () {

        var tab = self.getSelectedTab();
        var confirmButton = self.getConfirmButton();
        var okButton = self.getOkButton();
        var studyCodeSelect = self.getStudyCodeSelect();

        self.log("tab: " + tab);
        self.log("confirmButton: " + confirmButton);
        self.log("okButton: " + okButton);

        if (tab === "LVA-Anmeldung") {
            self.onLVAPage();
        } else if (tab === "Gruppen") {
            self.onGroupPage();
        } else if (tab === "Prüfungen") {
            self.onExamPage();
        } else if (studyCodeSelect.length > 0) {
            self.onStudyCodeSelectPage();
        } else if (confirmButton.length > 0) {
            self.onConfirmPage();
        } else if (okButton.length > 0) {
            self.onConfirmInfoPage();
        }
    };

    self.getLVANumber = function () {
        return $('#contentInner').find('h1 span:first').text().trim();
    };

    self.getLVAName = function () {
        return $('#contentInner').find('h1').justtext();
    };

    self.getSemester = function () {
        return $('#contentInner').find('h1 select').val();
    };

    self.getSelectedTab = function () {
        return $('li.ui-tabs-selected').text().trim();
    };

    self.getSubHeader = function () {
        return $('#contentInner').find('#subHeader').text().trim();
    };

    self.onLVAPage = function () {
        self.onGroupPage();
    };

    self.onGroupPage = function () {
        if (options.lvaCheckEnabled && !self.doLvaCheck()) {
            return;
        }

        if (options.lvaSemesterCheckEnabled && !self.doSemesterCheck()) {
            return;
        }

        var groupLabel = self.doGroupCheck();
        if (groupLabel === null) {
            return;
        }
        self.highlight(groupLabel);

        var groupWrapper = groupLabel.closest('.groupWrapper');

        // open the panel if the option is activated
        if (options.openPanel) {
            groupWrapper.children().show();
            // for some reason, we have to wait some time here and try it again :/
            setTimeout(function () {
                groupWrapper.children().show();
            }, 100);
        }

        // search for the registration button
        var regButton = self.getRegistrationButton(groupWrapper);
        self.log('regButton: ' + regButton);


        // push the button
        if (regButton.length > 0) {

            self.highlight(regButton);
            regButton.focus();

            if (options.autoRegister) {
                regButton.click();
            }
        } else {
            if (self.getGroupCancelButton(groupWrapper).length > 0) {
                self.pageOut('you are registered in group: ' + options.nameOfGroup);
            } else {
                // Only refresh the page if the option is set and if the registration is not yet completed.
                if (options.autoRefresh) {
                    refreshPage();
                }
                self.pageOut('no registration button found');
            }
        }
    };

    self.onExamPage = function () {
        if (options.lvaCheckEnabled && !self.doLvaCheck()) {
            return;
        }

        if (options.lvaSemesterCheckEnabled && !self.doSemesterCheck()) {
            return;
        }

        var examLabel = self.doExamCheck();
        if (examLabel === null) {
            return;
        }
        self.highlight(examLabel);

        var examWrapper = examLabel.closest('.groupWrapper');

        // open the panel if the option is activated
        if (options.openPanel) {
            examWrapper.children().show();
            // for some reason, we have to wait some time here and try it again :/
            setTimeout(function () {
                examWrapper.children().show();
            }, 100);
        }

        // search for the registration button
        var regButton = self.getRegistrationButton(examWrapper);
        self.log('regButton: ' + regButton);


        // push the button
        if (regButton.length > 0) {

            self.highlight(regButton);
            regButton.focus();

            if (options.autoRegister) {
                regButton.click();
            }
        } else {
            if (self.getGroupCancelButton(examWrapper).length > 0) {
                self.pageOut('you are registered in exam: ' + options.nameOfExam);
            } else {
                // Only refresh the page if the option is set and if the registration is not yet completed.
                if (options.autoRefresh) {
                    refreshPage();
                }
                self.pageOut('no registration button found');
            }
        }
    };

    self.onStudyCodeSelectPage = function () {
        var studyCodeSelect = self.getStudyCodeSelect();
        var confirmButton = self.getConfirmButton();
        self.highlight(confirmButton);
        if (options.studyCode !== undefined && options.studyCode.length > 0) {
            self.setSelectValue(studyCodeSelect, options.studyCode);
        }
        confirmButton.focus();
        if (options.autoConfirm) {
            confirmButton.click();
        }
    };

    self.onConfirmPage = function () {
        var confirmButton = self.getConfirmButton();
        self.highlight(confirmButton);
        confirmButton.focus();
        if (options.autoConfirm) {
            confirmButton.click();
        }
    };

    self.onConfirmInfoPage = function () {
        var okButton = self.getOkButton();
        self.highlight(okButton);
        if (options.autoOkPressAtEnd) {
            setTimeout(function () {
                var okButton = self.getOkButton();
                okButton.click();
            }, options.okPressAtEndDelayInMs);
        }
    };

    self.pageOut = function (text) {
        var out = self.getOutputField();
        out.text(text);
    };

    self.pageCountdown = function (text) {
        var out = self.getCountdownField();
        out.text(text);
    };

    self.pageLog = function (text) {
        self.appendToLogField(text);
    };

    self.getOutputField = function () {
        var outputField = $('#TQRScriptOutput');
        if (outputField.length === 0) {
            self.injectOutputField();
            outputField = self.getOutputField();
        }
        return outputField;
    };

    self.getCountdownField = function () {
        var countdownField = $('#TQRScriptCountdown');
        if (countdownField.length === 0) {
            self.injectCountdownField();
            countdownField = self.getCountdownField();
        }
        return countdownField;
    };

    self.getLogField = function () {
        var logField = $('#TQRScriptLog');
        if (logField.length === 0) {
            self.injectLogField();
            logField = self.getLogField();
            if (options.showLog) {
                logField.show();
            } else {
                logField.hide();
            }
        }
        return logField;
    };

    self.injectOutputField = function () {
        var el = $('#contentInner');
        var log = $('#TQRScriptLog');
        if (log.length) {
            el = log;
        }
        el.before('<div id="TQRScriptOutput" style="color: red; font-weight: bold; font-size: 14pt; padding: 8px 0px;"></div>');
    };

    self.injectCountdownField = function () {
        var el = $('#contentInner');
        var log = $('#TQRScriptLog');
        if (log.length) {
            el = log;
        }
        el.before('<div id="TQRScriptCountdown" style="color: blue; font-weight: bold; font-size: 14pt; padding: 8px 0px;"></div>');
    };

    self.injectLogField = function () {
        $('#contentInner').before('<div id="TQRScriptLog" style="color: black; background-color: #FFFCD9; font-size: 10pt;"><b>Information Log:</b></div>');
    };

    self.appendToLogField = function (text) {
        var log = self.getLogField();
        var newText = log.html() + "<br />" + text;
        log.html(newText);
    };

    self.getRegistrationButton = function (groupWrapper) {
        var regButton;
        if (options.registrationType === "group"
            || options.registrationType === "exam"
            || options.registrationType === "lva") {
            regButton = $(groupWrapper).find("input:submit[value='Anmelden']");
            if (regButton.length === 0) {
                regButton = $(groupWrapper).find("input:submit[value='Voranmelden']");
                if (regButton.length === 0) {
                    regButton = $(groupWrapper).find("input:submit[value='Voranmeldung']");
                }
            }
        } else {
            self.pageLog("registrationType Error: unknown type '" + options.registrationType + "'");
        }
        return regButton;
    };

    self.getGroupCancelButton = function (groupWrapper) {
        var unregButton = null;
        if (options.registrationType === "group") {
            unregButton = $(groupWrapper).find("input:submit[value='Abmelden']");
        } else if (options.registrationType === "exam") {
            unregButton = $(groupWrapper).find("input:submit[value='Abmelden']");
        } else if (options.registrationType === "lva") {
            unregButton = $(groupWrapper).find("input:submit[value='Abmelden']").filter(function (index) {
                return $(this).attr("id") !== 'registrationForm:confirmOkBtn';
            });
        } else {
            self.pageLog("registrationType Error: unknown type '" + options.registrationType + "'");
        }
        return unregButton;
    };

    self.getConfirmButton = function () {
        var confirmButton = $("form#regForm input:submit[value='Anmelden']");
        if (confirmButton.length === 0) {
            confirmButton = $("form#regForm input:submit[value='Voranmelden']");
            if (confirmButton.length === 0) {
                confirmButton = $("form#regForm input:submit[value='Voranmeldung']");
            }
        }
        return confirmButton;
    };

    self.getOkButton = function () {
        return $("form#confirmForm input:submit[value='Ok']");
    };

    self.getStudyCodeSelect = function () {
        return $("#regForm").find("select");
    };

    self.getGroupLabel = function (nameOfGroup) {
        // Normalize group lables and configured group label before comparing.
        var normConfName = nameOfGroup.trim().replace(/\s\s+/gi, ' ');

        return $(".groupWrapper .header_element span").filter(function () {
            var normName = $(this).text().trim().replace(/\s\s+/gi, ' ');

            return normName === normConfName;
        });
    };

    self.getExamLabel = function (nameOfExam) {
        return $(".groupWrapper .header_element span").filter(function () {
            var tmp = $(this).text().trim();
            return tmp.match(nameOfExam);
        });
    };

    self.getExamDate = function (nameOfExam, dateOfExam) {
        return $(".groupWrapper .header_element").filter(function () {
            var examData = $(this).text().trim();
            var examLabel = self.getExamLabel(nameOfExam).first().text().trim() + " ";
            var examDate = examData.replace(examLabel, '');
            return examDate.match(dateOfExam);
        });
    };

    self.highlight = function (object) {
        object.css("background-color", "lightgreen");
    };

    self.isCorrectSemester = function () {
        return self.getSubHeader().contains(options.lvaSemester);
    };

    self.setSelectValue = function ($element, value) {
        $element.find('option').removeAttr('selected');
        $element.find('option[value="' + value + '"]').attr('selected', 'selected');
    };

    self.doGroupCheck = function () {
        var groupLabel = self.getGroupLabel(options.nameOfGroup);
        if (groupLabel.length === 0) {
            self.pageOut('group not found error: ' + options.nameOfGroup);
            return null;
        } else {
            return groupLabel;
        }
    };

    self.doLvaCheck = function () {
        var lvaNumber = self.getLVANumber();
        lvaNumber = lvaNumber.replace(/[^\d]/, '');
        var optionsLvaNumber = options.lvaNumber.replace(/[^\d]/, '');
        if (lvaNumber !== optionsLvaNumber) {
            self.pageOut('wrong lva number error: expected: ' + optionsLvaNumber + ', got: ' + lvaNumber);
            return false;
        }
        return true;
    };

    self.doSemesterCheck = function () {
        var subheader = self.getSubHeader();
        if (subheader.indexOf(options.lvaSemester) === -1) {
            self.pageOut('wrong semester error: expected: ' + options.lvaSemester + ', got: ' + subheader.substring(0, 5));
            return false;
        }
        return true;
    };

    self.doExamCheck = function () {
        var examLabel = self.getExamLabel(options.nameOfExam);
        var examData = self.getExamDate(options.nameOfExam, options.dateOfExam);
        if (examLabel.length === 0) {
            self.pageOut('exam not found error: ' + options.nameOfExam);
            return null;
        } else if (examData.length === 0) {
            self.pageOut('Date not found: ' + options.dateOfExam);
            return null;
        } else {
            return examData;
        }
    };

    self.getFormatedDate = function (date) {
        return "" + date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
    };
  
    self.navigateToSemester = function () {
      
      	var specifiedURL = '';
      
      	if (options.registrationType === "lva") {
            // URL for LVA registration type
          	specifiedURL = 'https://tiss.tuwien.ac.at/education/course/courseRegistration.xhtml?courseNr=' + options.lvaNumber.replace(/[^\d]/, '') + '&semester=' + options.lvaSemester;
            console.log("Registration type is LVA");
        } else if (options.registrationType === "group") {
            // URL for group registration type
          	specifiedURL = 'https://tiss.tuwien.ac.at/education/course/groupList.xhtml?courseNr=' + options.lvaNumber.replace(/[^\d]/, '') + '&semester=' + options.lvaSemester;
            console.log("Registration type is Group");
        } else if (options.registrationType === "exam") {
            // URL for exam registration type
          	specifiedURL = 'https://tiss.tuwien.ac.at/education/course/examDateList.xhtml?courseNr=' + options.lvaNumber.replace(/[^\d]/, '') + '&semester=' + options.lvaSemester;
            console.log("Registration type is Exam");
        } else {
            // URL for other or unknown registration types
            // default to LVA main page
          	specifiedURL = 'https://tiss.tuwien.ac.at/course/educationDetails.xhtml?courseNr=' + options.lvaNumber.replace(/[^\d]/, '');
            console.log("Unknown registration type"); 
        }

      
        // Get the current URL's search parameters
        var urlSearchParams = new URLSearchParams(window.location.search);

        // Check if the specified query parameters exist, and if true, delete them
				if (urlSearchParams.has('dswid') && urlSearchParams.has('dsrid')) {
    			urlSearchParams.delete('dswid');
    			urlSearchParams.delete('dsrid');
				}

        // Build the modified URL
        var currentURL = window.location.origin + window.location.pathname + '?' + urlSearchParams.toString();


        // Check if the current page is not already the specified LVA page
        if (currentURL !== specifiedURL) {
            // Navigate to the LVA page
            window.location.href = specifiedURL;
        }
		};
  
  	self.navigateToLVA = function () {
        
        var specifiedURL = 'https://tiss.tuwien.ac.at/course/educationDetails.xhtml?courseNr=' + options.lvaNumber.replace(/[^\d]/, '');

        // Get the current URL's search parameters
        var urlSearchParams = new URLSearchParams(window.location.search);

        // Check if the specified query parameters exist, and if true, delete them
        if (urlSearchParams.has('dswid') && urlSearchParams.has('dsrid')) {
            urlSearchParams.delete('dswid');
            urlSearchParams.delete('dsrid');
        }

        // Build the modified URL
        var currentURL = window.location.origin + window.location.pathname + '?' + urlSearchParams.toString();
  
        // Check if the current page is not already the specified LVA page
        if (currentURL !== specifiedURL) {
            // Navigate to the LVA page
            window.location.href = specifiedURL;
        }
		};


    self.log = function (message) {
        console.log(message);
    };


    // Initialize the script
    self.init();
})();
