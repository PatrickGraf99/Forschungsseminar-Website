const NUM_OF_CHARS = 2352 //Works for: Win11, Firefox Browser - fullscreen, 1920x1080, 100% scale
let last_choice = Math.infinity

let filler_outlier_list = [{"o": "e"}, {"0": "8"}, {"v": "u"},
    {"T": "7"}, {"e": "o"}, {"8": "0"}, {"u": "v"}, {"7": "T"},]

// saved states for converting to csv
let currentPair = {}
let currentFiller = ""
let currentOutlier = ""
let currentPairIndex = 0
let currentParticipantID = NaN
let currentTrial = NaN
let currentMode = null
let currentEnvironment = null


//last time that a spacebar press was registered
let lastRecordedTime = 0

//object containing all used colors
const colors = {
    darkText: '#23233d',
    lightText: '#f0f0f0',
    darkBackground: '#23233d',
    lightBackground: '#f0f0f0'
}

//Experiment time in milliseconds
const EXPERIMENT_TIME = 1000 * 10


/**
 * Sets the text of the content to contain only the filler and replaces one instance with the outlier
 * Reference constants at top of class for approximation on how many chars are needed for different screen sizes.
 * @param filler The character that fills the entire screen.
 * @param outlier An outlier (different character) that occurs only once.
 */
let fillScreen = function (filler, outlier) {
    let content = document.querySelector('.content')
    let fillText = ''
    let outlierIndex = Math.floor(Math.random() * (NUM_OF_CHARS / 2))
    for (let i = 0; i < NUM_OF_CHARS / 2; i++) {
        if (i === outlierIndex) {
            fillText = fillText + `${outlier} `
        } else {
            fillText = fillText + `${filler} `
        }
    }
    fillText = fillText + '_'
    content.innerText = fillText
}

/**
 * Creates a random number using the filler_outlier_pairs list and fills the screen with the selected pair. If the same
 * random number is chosen again, a new one is created
 */
let fillScreenRandomly = function () {
    if (currentPairIndex >= filler_outlier_list.length) {
        currentPairIndex = 0
    }

    // Save last_choice to avoid duplicates in next generation
    currentPair = filler_outlier_list[currentPairIndex]
    currentPairIndex += 1
    //Get the key as the filler...
    currentFiller = Object.keys(currentPair)[0]
    //...and use its value as the outlier
    currentOutlier = currentPair[currentFiller]
    //Finally call the fillscreen method
    fillScreen(currentFiller, currentOutlier)
}

/*
 * Reads the settings from the starting dialogue, returns if no ui mode or env mode is selected or if no participant id
 * can be read
 */
let readSettings = function () {
    console.log("Parsing settings...")
    let rbtnDarkMode = document.getElementById("dark-mode")
    let rbtnLightMode = document.getElementById("light-mode")
    let rbtnDarkEnv = document.getElementById("dark-env")
    let rbtnLightEnv = document.getElementById("light-env")
    if (!rbtnDarkMode.checked && !rbtnLightMode.checked) {
        console.log("Please select an UI mode")
        return
    }
    if (!rbtnDarkEnv.checked && !rbtnLightEnv.checked) {
        console.log("Please select an environment mode")
        return;
    }

    let partID = parseInt(document.getElementById("part-id").value)
    if (isNaN(partID)) {
        console.log("Please enter a valid ID")
        return;
    }

    //Remove focus from button so spacebar doesn't trigger
    document.getElementById("btn-start").blur()

    let ui = rbtnDarkMode.checked ? "dark_mode" : "light_mode"
    let env = rbtnDarkEnv.checked ? "dark_env" : "light_env"
    let mode = [ui, env]
    //Change ui mode depending on the selected button
    //Mode change now directly bound to button onclicks
    /*if (rbtnDarkMode.checked) {
        setDarkMode()
    } else {
        setLightMode()
    }*/
    startExperiment(mode, partID)
}

/**
 * Sets application to dark ui
 */
function setDarkMode() {
    let content = document.querySelector('.content')
    let body = document.body
    content.style.backgroundColor = colors.darkBackground
    content.style.color = colors.lightText
    body.style.backgroundColor = colors.darkBackground
}

/**
 * Sets application to light ui
 */
function setLightMode() {
    let content = document.querySelector('.content')
    let body = document.body
    content.style.backgroundColor = colors.lightBackground
    content.style.color = colors.darkText
    body.style.backgroundColor = colors.lightBackground
}

/**
 * Hides the setting box
 */
function hideSettings() {
    let settings = document.querySelector('.settings')
    settings.classList.add('hidden')
}

/**
 * Displays the settings box
 */
function showSettings() {
    let settings = document.querySelector('.settings')
    settings.classList.remove('hidden')
}

/**
 * Starts the experiment by resetting the times list and lastRecordedTime and adding a keydown listener to the document.
 * Hides the settings and fills the screen randomly, then sets a timeout after which all recorded data will be saved and
 * the settings will show up again
 * @param mode
 * @param partID
 */
let startExperiment = function (mode, partID) {
    console.log("Starting experiment for selection " + mode + " ...")
    currentPairIndex = 0
    currentMode = mode[0]
    currentEnvironment = mode[1]
    currentTrial = 1
    currentParticipantID = partID
    lastRecordedTime = Date.now()
    // Add keydown detection to spacebar
    document.addEventListener("keydown", handleKeyPress )
    hideSettings()
    fillScreenRandomly()
}

/**
 * Saves the data to the server and shows settings again, also removing the keydown listener to prevent any shenanigans
 * when spacebar is pressed
 * @param mode
 * @param partID
 * @returns {Promise<void>}
 */
let endExperiment = async function () {
    showSettings()
    document.removeEventListener("keydown", handleKeyPress);
    document.querySelector(".content").innerHTML = ''

}

/**
 * Simple fetch that posts data to our Server
 * @returns {Promise<void>}
 * @param data
 */
let saveData = async function (data) {
    const url = 'http://152.53.125.233:6969/write-data'
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'username': 'Forschungsseminar',
                'password': 'tV04rKqF0REtpsjqK7BZ',
            },
            body: JSON.stringify({
                "message": data, "id": currentParticipantID})
            }).then((res) => {
                console.log('Server responded with: ' + res.status)
        })
        } catch (error) {
        console.error(error)
    }
}

let handleKeyPress = function (event) {
    if (event.key === ' ') {
        onSpacePressed()
    }
}

let onSpacePressed = async function () {
    console.log('Space was pressed')
    let timestamp = Date.now()
    let timeToFinish = timestamp - lastRecordedTime
    lastRecordedTime = timestamp
    let data = currentParticipantID + "," + timestamp + "," + timeToFinish + "," + currentMode + "," +
        currentEnvironment + "," + currentFiller + "," + currentOutlier + "," +  currentTrial
    console.log(data)
    localStorage.setItem(timestamp+"", data)
    await saveData(data)
    currentTrial += 1
    if (currentTrial > 5) {
        endExperiment()
    } else {
        fillScreenRandomly()
    }

}



