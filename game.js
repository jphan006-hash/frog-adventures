const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const ui = document.getElementById("ui");
const info = document.getElementById("info");

let players = [];
let bodies = [];
let meeting = false;
let rooms = [
    {x:50, y:50, w:200, h:200},
    {x:350, y:50, w:200, h:200},
    {x:50, y:350, w:200, h:200},
    {x:350, y:350, w:200, h:200}
];

// Frog killer colors
const frogColors = ["lime","yellow","magenta"];

// Create 16 players
for(let i=0;i<16;i++){
    players.push({
        id:i,
        x: Math.random()*580,
        y: Math.random()*580,
        alive:true,
        role:"detective",
        roleName:"Detective",
        color:"white",
        killCooldown:0,
        vision:100
    });
}

// Assign 3 killers
let shuffled = [...players].sort(()=>Math.random()-0.5);
for(let i=0;i<3;i++){
    shuffled[i].role="killer";
    shuffled[i].roleName="Frog Killer";
    shuffled[i].color=frogColors[i];
    shuffled[i].killCooldown=0;
}

// You are player 0
let you = players[0];

// Movement
document.addEventListener("keydown", e=>{
    if(!you.alive || meeting) return;
    if(e.key==="ArrowUp") you.y-=5;
    if(e.key==="ArrowDown") you.y+=5;
    if(e.key==="ArrowLeft") you.x-=5;
    if(e.key==="ArrowRight") you.x+=5;

    // Prevent leaving canvas
    you.x=Math.max(0,Math.min(590,you.x));
    you.y=Math.max(0,Math.min(590,you.y));
});

// Kill (SPACE)
document.addEventListener("keydown", e=>{
    if(e.key===" " && you.role==="killer" && !meeting && you.alive && you.killCooldown<=0){
        players.forEach(p=>{
            if(p!==you && p.alive && dist(you,p)<20){
                p.alive=false;
                bodies.push({...p});
                you.killCooldown=200; // cooldown frames
            }
        });
    }
});

// Emergency meeting (E)
document.addEventListener("keydown", e=>{
    if(e.key.toLowerCase()==="e" && !meeting){
        startMeeting();
    }
});

// Distance helper
function dist(a,b){
    return Math.hypot(a.x-b.x,a.y-b.y);
}

// AI Movement & Killing
function updateAI(){
    players.forEach(p=>{
        if(!p.alive || p===you) return;

        p.x += (Math.random()-0.5)*2;
        p.y += (Math.random()-0.5)*2;

        p.x=Math.max(0,Math.min(590,p.x));
        p.y=Math.max(0,Math.min(590,p.y));

        // Killer AI
        if(p.role==="killer" && Math.random()<0.01 && p.killCooldown<=0){
            let targets = players.filter(t=>t.alive && t!==p);
            let target = targets[Math.floor(Math.random()*targets.length)];
            if(target && dist(p,target)<20){
                target.alive=false;
                bodies.push({...target});
                p.killCooldown=200;
            }
        }

        if(p.killCooldown>0) p.killCooldown--;
    });
}

// Auto-report bodies
function checkBodies(){
    for(let b of bodies){
        if(dist(you,b)<25 && !meeting){
            startMeeting();
        }
    }
}

// Start meeting
function startMeeting(){
    meeting=true;
    ui.innerHTML="<h3>Meeting! Vote someone:</h3>";

    players.forEach(p=>{
        if(p.alive){
            let btn=document.createElement("button");
            btn.innerText="Player "+p.id;
            btn.onclick=()=>vote(p);
            ui.appendChild(btn);
        }
    });
}

// Vote
function vote(p){
    p.alive=false;
    meeting=false;
    ui.innerHTML="";
    checkWin(p);
}

// Win check
function checkWin(voted){
    if(voted.role!=="killer"){
        alert("❌ Wrong vote! Killers win!");
        location.reload();
        return;
    }

    let killersAlive=players.filter(p=>p.role==="killer" && p.alive).length;
    let othersAlive=players.filter(p=>p.role!=="killer" && p.alive).length;

    if(killersAlive===0){
        alert("🎉 Detectives win!");
        location.reload();
    }

    if(killersAlive>=othersAlive){
        alert("💀 Killers win!");
        location.reload();
    }
}

// Draw rooms
function drawRooms(){
    ctx.strokeStyle="gray";
    rooms.forEach(r=>{
        ctx.strokeRect(r.x,r.y,r.w,r.h);
    });
}

// Draw players & fog of war
function draw(){
    ctx.clearRect(0,0,600,600);
    drawRooms();

    players.forEach(p=>{
        if(!p.alive) return;

        // Fog of war: only show if within vision
        if(dist(you,p)<you.vision || p===you){
            ctx.fillStyle=(p===you)?"cyan":p.color;
            ctx.fillRect(p.x,p.y,10,10);
        }
    });

    // Bodies
    bodies.forEach(b=>{
        if(dist(you,b)<you.vision) ctx.fillStyle="red";
        ctx.fillRect(b.x,b.y,10,10);
    });

    // Info panel
    info.innerHTML=`Role: ${you.roleName} <br> Kill Cooldown: ${you.killCooldown}`;
}

// Loop
function loop(){
    updateAI();
    checkBodies();
    draw();
    requestAnimationFrame(loop);
}

loop();
