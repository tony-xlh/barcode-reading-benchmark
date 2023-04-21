export class Project {
  info:ProjectInfo;
  baseURL = "";
  constructor(info:ProjectInfo){
    this.info = info;
  }

  setBaseURL(baseURL:string){
    this.baseURL = baseURL;
  }

  getImageLink(image:string){
    return this.baseURL + "/" + image;
  }

  getAnnotationsLink(){
    return this.baseURL + "/annotations.zip";
  }
}

export interface ProjectInfo {
  name:string;
  creationTimestamp:number;
  images:string[];
}
