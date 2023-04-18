/*
* Convert decimal data to hex (4->0100 e.g.)
*/
export const DecimalToHex = (num:string):string => {
  let hex = parseInt(num).toString(16);
  const l = hex.length;
  if(l < 4){
    for(let i = 0; i < 4-l; i++) {
      hex = "0" + hex;
    }
  }
  return hex.toUpperCase();
}