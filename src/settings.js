let driver;




function setConnectivityIndicator(isConnected)
{
    var element = document.getElementById("neo4j_indicator");

    if(isConnected)
    {
        element.innerHTML = "&#xe2c2;";
        element.title="Connected to DB!"
    }else
    {
        element.innerHTML = "&#xe2c1;";
        element.title="No connection to DB, please check the settings page!"
    }
}


document.addEventListener('DOMContentLoaded', async () => {

    if (sessionStorage.getItem("url") == null || sessionStorage.getItem("url") === "") {
        // displayContent(true);

    }
    else {
        fillSettingsFromStorage();
        await initDriverFromStorage();
    }

});


function fillSettingsFromStorage() {

    var url = sessionStorage.getItem("url");
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");

    document.getElementById("url").value =  url;
    document.getElementById("username").value = username;
    document.getElementById("password").value = password;
}


async function initDriverFromStorage()
{
    var url = sessionStorage.getItem("url");
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");

    if (await setupDBDriver(url, username, password) === true) {
        setConnectivityIndicator(true);
        showNotifications(false, "");

        
    } else {
        alert("Could not connect to " + url)
        setConnectivityIndicator(false);
        showNotifications(true, "");

    }
}

// Function to set session storage
async function setSessionStorage(event) {


    var url = document.getElementById("url").value;
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Check if the inputs are not empty before setting session storage
    if (url && username && password) {
        sessionStorage.setItem("url", url);
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("password", password);
        if (await setupDBDriver(url, username, password) === true) {
            
            setConnectivityIndicator(true)
            showNotifications(false, "");
        } else {
            alert("Could not connect to " + url)
            showNotifications(true, "");
        }

    }
    else
    {
        showNotifications(true, "");
        setConnectivityIndicator(false);
    }
}

function showNotifications(isError, text)
{
    if(isError)
    {
        document.getElementById("error").style.display = 'flex';
        document.getElementById("sucess").style.display = 'none';

    }else{
        document.getElementById("success").style.display = 'flex';
        document.getElementById("error").style.display = 'none';

    }
}

async function setupDBDriver(url, username, password) {
    try {
        driver = neo4j.driver(url, neo4j.auth.basic(username, password))
        const serverInfo = await driver.getServerInfo()
        console.log(serverInfo)
        return true;
    } catch (err) {
        console.log(`Connection error\n${err}\nCause: ${err.cause}`)
        if (driver == null) {
            console.log(driver)
            await driver.close()
        } return false;
    }
}

// Function to clear session storage
async function clearSessionStorage() {
    sessionStorage.removeItem("url");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");

    if (driver == null) {
        await driver.close()

        alert("Connection closed!");
    }
    setConnectivityIndicator(false);
}