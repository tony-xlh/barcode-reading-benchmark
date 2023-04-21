export class Project {
  info:ProjectInfo;
  constructor(info:ProjectInfo){
    this.info = info;
  }
}

export interface ProjectInfo {
  name:string;
  creationTimestamp:number;
  images:string[];
}

export interface OnlineProjectsManifest {
  projects:OnlineProject[];
}

export class OnlineProject {
  project:Project;
  baseURL:string;
  constructor(project:Project,baseURL:string){
    this.project = project;
    this.baseURL = baseURL;
  }

  getImageLink(image:string){
    return this.baseURL + "/" + image;
  }

  getAnnotationsLink(){
    return this.baseURL + "/annotations.zip";
  }
}
