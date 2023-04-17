export const readFileAsDataURL = async (file:File):Promise<string> => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function(e:any){
      resolve(e.target.result);
    };
    fileReader.onerror = function () {
      reject('oops, something went wrong.');
    };
    fileReader.readAsDataURL(file);
  });
}

export const readFileAsText = async (file:File):Promise<string> => {
  return new Promise(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function(e:any){
      resolve(e.target.result);
    };
    fileReader.onerror = function () {
      reject('oops, something went wrong.');
    };
    fileReader.readAsText(file);
  });
}
