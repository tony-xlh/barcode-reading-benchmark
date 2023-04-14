export class Project {
  projectInfo:ProjectInfo;
  constructor(info:ProjectInfo){
    this.projectInfo = info;
  }
}

export interface ProjectInfo {
  name:string;
  creationTimestamp:number;
  images?:string[];
}