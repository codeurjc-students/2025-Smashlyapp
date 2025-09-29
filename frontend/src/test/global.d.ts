// Global types for tests
declare global {
  var fetch: any;
  
  namespace NodeJS {
    interface Global {
      fetch: any;
    }
  }
}

export {};