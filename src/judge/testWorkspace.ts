import {
    createWorkspace,
    populateWorkspace,
    deleteWorkspace
} from "./workspace.js";

const workspace = await createWorkspace("demo");

await populateWorkspace(
    workspace,
    {
        driverPath: "./assets/main.cpp",
        testcasePath: "./assets/testcases.txt"
    },
    `
class Solution{
public:
    int add(int a,int b){
        return a+b;
    }
};
`
);

console.log(workspace);

await deleteWorkspace(workspace);