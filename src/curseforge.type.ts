interface RootObject {
    id: number;
    author: Author;
    avatarUrl: string;
    categories: Category[];
    class: Class;
    creationDate: number;
    downloads: number;
    gameVersion: string;
    name: string;
    slug: string;
    summary: string;
    updateDate: number;
    releaseDate: number;
    fileSize: number;
    isClientCompatible: boolean;
    latestFileDetails: LatestFileDetails;
    hasEarlyAccessFiles: boolean;
    hasLocalization: boolean;
    status: number;
    websiteRecentFiles: WebsiteRecentFile[];
  }
  
  interface WebsiteRecentFile {
    gameVersion: GameVersion;
    files: File[];
  }
  
  interface File {
    fileName: string;
    id: number;
    dateCreated: string;
    dateModified: string;
    displayName: string;
    releaseType: number;
    gameVersions: string[];
    earlyAccessEndDate?: any;
    gameVersionTypeIds: number[];
    isEarlyAccessContent: boolean;
  }
  
  interface GameVersion {
    id: number;
    name: string;
  }
  
  interface LatestFileDetails {
    id: number;
    gameVersions: string[];
    gameVersionTypeIds: number[];
  }
  
  interface Class {
    id: number;
    dateModified: string;
    gameId: number;
    iconUrl: string;
    name: string;
    slug: string;
    url: string;
    classId?: any;
    displayIndex: number;
    isClass: boolean;
    parentCategoryId?: any;
  }
  
  interface Category {
    id: number;
    dateModified: string;
    gameId: number;
    iconUrl: string;
    name: string;
    slug: string;
    url: string;
    classId: number;
    isClass: boolean;
    parentCategoryId: number;
  }
  
  interface Author {
    id: number;
    name: string;
    username: string;
    isEarlyAccessAuthor: boolean;
  }

  export default RootObject;