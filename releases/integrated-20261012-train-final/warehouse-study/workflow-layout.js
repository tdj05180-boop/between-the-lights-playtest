// Single source of spatial anchors; the sorting game's rules remain in experiments/minigames/sorting.js.
export const workflow={
 spawn:{x:10.5,z:-13}, pickup:{x:10.5,z:-11.5}, start:{x:10.5,z:-12.5},
 boxOrigin:{x:10.5,z:-10,yaw:Math.PI},
 docks:[{x:-4,color:'inbound'},{x:6,color:'blue'},{x:15,color:'red'}],
 trucks:[{x:6,z:-14,color:'blue'},{x:15,z:-14,color:'red'}],
 belts:[{x:-4,z:-10.075,length:9.75,rotation:0},{x:3.25,z:-5.6,length:14.5,rotation:Math.PI/2},{x:10.5,z:-8.3,length:5.4,rotation:0}],
 route:[[-15,12],[-15,4],[-15,12],[-4,12],[0,12],[13,12],[13,0],[13,-3],[15,-3],[15,-12],[10.5,-12],[6,-14],[10.5,-12],[15,-14],[19,-14],[20.5,-14],[20.5,-4],[15,-4],[15,12]],
};
