var currentLeftChamp = null;
var currentRightChamp = null;
var nextLeftChamp = null;
var nextRightChamp = null;

var options = {
    include_all_skins: true,
    include_female_champions: true,
    include_male_champions: true,
    include_illegal_champions: false
  };

var showSmashButtons = false;

var possible_champions = [];
var chosen_champions = [];

var seedInput = null;
var seed = null;
var random = null;

$("#left-img").on("load", () => {
    $("#left-name").html(currentLeftChamp.name);
    toggleLeftChampion(true);
    updateSmashButtons();
});

$("#left-img").on("error", () => {
    if(possible_champions.length > 0){
        chooseRight();
    }
});

$("#right-img").on("load", () => {
    $("#right-name").html(currentRightChamp.name);
    toggleRightChampion(true);
    updateSmashButtons();
});

$("#right-img").on("error", () => {
    if(possible_champions.length > 0){
        chooseLeft();
    }
});

function startGame(){
    hideMainMenu();

    let promisedSkins = [];
    if(options.include_female_champions) {
        promisedSkins.push(addSkins(female_champions));
    }
    
    if(options.include_male_champions) {
        promisedSkins.push(addSkins(male_champions));
    }

    if(options.include_illegal_champions) {
        promisedSkins.push(addSkins(illegal_champions));
    }

    if(!options.include_female_champions && 
        !options.include_male_champions &&
        !options.include_illegal_champions
    ) {
        $("#champions-div").html("What is wrong with you? Why would you not select any champions to include?! Go away...");
        showChampions();
        return;
    }

    seedInput = $("#seed").val();
    if(seedInput == null || seedInput == ""){
        seedInput = Math.floor(Math.random() * 100000000);
    }

    seed = cyrb128(seedInput);
    random = sfc32(seed);
    
    Promise.all(promisedSkins).then(() => {
        shuffle(possible_champions);
        showChampions();
        nextRound();
    });
}

function hideMainMenu() {
    $("#main-menu").toggleClass("d-none", true);
    $("#load-game").toggleClass("d-none", true);

    $("#loading-champions").toggleClass("d-none", false);
}

function showChampions() {
    $("#loading-champions").toggleClass("d-none", true);
    $("#seed-display").html(seedInput);

    $("#champions-div").toggleClass("d-none", false);
    $("#save-btn").toggleClass("d-none", false);
}

function nextRound() {
    updateSmashButtons(true);
    toggleLeftChampion(false);
    toggleRightChampion(false);

    if(possible_champions.length < 2) {
        shuffle(chosen_champions);
        possible_champions = possible_champions.concat(chosen_champions);
        chosen_champions = [];
    }

    if(possible_champions.length == 1){
        currentLeftChamp = possible_champions[0];
        $("#left-img").attr("src", `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${currentLeftChamp.skin}.jpg`);
        $("#right-champion").toggleClass("d-none", true);
        $("#or-div").toggleClass("d-none", true);
        $("#smash-champion").toggleClass("d-none", false);
        $("#smash-champion-name").toggleClass("d-none", false);
        $("#smash-champion-name").html(currentLeftChamp.name);
        return;
    }

    if(nextRightChamp == null) {
        currentLeftChamp = possible_champions[0];
        currentRightChamp = possible_champions[1];
        nextLeftChamp = possible_champions[2];
        nextRightChamp = possible_champions[3];

        possible_champions = possible_champions.splice(4);
    } else {
        currentLeftChamp = nextLeftChamp;
        currentRightChamp = nextRightChamp;
    
        nextLeftChamp = possible_champions[0];
        nextRightChamp = possible_champions[1];

        possible_champions = possible_champions.splice(2);
    }

    preloadChampionImage(nextLeftChamp);
    preloadChampionImage(nextRightChamp);

    $("#left-img").attr("src", `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${currentLeftChamp.skin}.jpg`);
    $("#right-img").attr("src", `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${currentRightChamp.skin}.jpg`);
}

function pickNextChampion(ignoreChamp){
    for(let i = 0; i < possible_champions.length; i++) {
        let nextChamp = possible_champions[i];
        if(nextChamp.skin != currentLeftChamp.skin && nextChamp.skin != currentRightChamp.skin && nextChamp.skin != ignoreChamp?.skin){
            return nextChamp;
        }
    }

    return null;
}

function chooseLeft(){
    chosen_champions.push(currentLeftChamp);
    nextRound();
}

function chooseRight(){
    chosen_champions.push(currentRightChamp);
    nextRound();
}

function toggleLeftChampion(visible){
    $("#left-name").toggleClass("d-none", !visible);
    $("#left-img").toggleClass("d-none", !visible);
    $("#left-img-placeholder").toggleClass("d-none", visible);
}

function toggleRightChampion(visible){
    $("#right-name").toggleClass("d-none", !visible);
    $("#right-img").toggleClass("d-none", !visible);
    $("#right-img-placeholder").toggleClass("d-none", visible);
}

function updateSmashButtons(reset=false){
    if(reset){
        showSmashButtons = false;
        $(".smash-button").toggleClass("d-none", true);
        return;
    }

    if(showSmashButtons){
        $(".smash-button").toggleClass("d-none", false);
    } else {
        showSmashButtons = true;
    }
}

function showChampionSplash(champion) {
    $("#splash-img").attr("src", `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.skin}.jpg`);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

async function addSkins(championList){
    for(let i = 0; i < championList.length; i++) {
        let champion = championList[i];
        let data = await fetchChampionData(champion);
        for(let j = 0; j < data.length; j++){
            possible_champions.push(data[j]);
        }
    }
}

async function fetchChampionData(champion){
    try {
        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/14.20.1/data/en_US/champion/${champion}.json`);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
    
        const json = await response.json();
        
        if(options.include_all_skins){
            return json.data[champion].skins.map(data => {
                return {
                    id: champion,
                    name: data.name == 'default' ? json.data[champion].name : data.name,
                    skin: `${champion}_${data.num}`,
                };
            });
        } else {
            return [{
                id: champion,
                name: json.data[champion].name,
                skin: `${champion}_0`,
            }];
        }

    } catch (error) {
      console.error(error.message);
    }
}

function createSaveFile() {
    var saveFile = {
        currentLeftChamp: currentLeftChamp,
        currentRightChamp: currentRightChamp,
        nextLeftChamp: nextLeftChamp,
        nextRightChamp: nextRightChamp,
        possible_champions: possible_champions,
        chosen_champions: chosen_champions,
        seedInput: seedInput,
        seed: seed
    };

    downloadObjectAsJson(saveFile, "savefile");
}

function loadSaveFile(file) {
    hideMainMenu();

    file.text()
        .then(json => JSON.parse(json))
        .then(content => {
            currentLeftChamp = content.currentLeftChamp;
            currentRightChamp = content.currentRightChamp;
            nextLeftChamp = content.nextLeftChamp;
            nextRightChamp = content.nextRightChamp;
            possible_champions = content.possible_champions;
            chosen_champions = content.chosen_champions;
            seedInput = content.seedInput;
            seed = content.seed;
            random = sfc32(seed);

            updateSmashButtons(true);
            showChampions();
            preloadChampionImage(nextLeftChamp);
            preloadChampionImage(nextRightChamp);
            $("#left-img").attr("src", `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${currentLeftChamp.skin}.jpg`);
            $("#right-img").attr("src", `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${currentRightChamp.skin}.jpg`);
        });
}

async function loadJson(path) {
    return await fetch(path)
     .then((response) => response.json());
}

function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }


function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

function sfc32(seed) {
    return function() {
      seed[0] |= 0; seed[1] |= 0; seed[2] |= 0; seed[3] |= 0;
      let t = (seed[0] + seed[1] | 0) + seed[3] | 0;
      seed[3] = seed[3] + 1 | 0;
      seed[0] = seed[1] ^ seed[1] >>> 9;
      seed[1] = seed[2] + (seed[2] << 3) | 0;
      seed[2] = (seed[2] << 21 | seed[2] >>> 11);
      seed[2] = seed[2] + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

function preloadChampionImage(champion) {
    if(champion == null) return;

    var img=new Image();
    img.src=`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion.skin}.jpg`;
}