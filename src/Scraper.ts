class Scraper 
{
    private baseURL: string;
    private path: string;
    private parameters: Record<string, string>;
    private modNames: string[];
    private URLs: string[];

    constructor(baseURL: string, path: string, parameters: Record<string, string>, modNames: string[])
    {
        this.baseURL = baseURL;
        this.path = path;
        this.parameters = parameters;
        this.modNames = modNames;
        this.URLs = [];

        modNames.forEach((modName) => {

            const parameter: Record<string, string> = {
                ...this.parameters,
                "searchFilter": modName
            };
            const url = this.baseURL + this.path + new URLSearchParams(parameter).toString();
            this.URLs.push(url);
        });
    }
    

    public async scrape(): Promise<Record<string, string>>
    {
        this.URLs.forEach(async url => {
            await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            })
        })
    }





}