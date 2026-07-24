import {
    createWorkspace,
    populateWorkspace,
    deleteWorkspace
} from "../workspace/workspace.js";

console.log("Present working directory:", process.cwd());

const workspace = await createWorkspace("demo");

await populateWorkspace(
    workspace,
    {
        driverPath: "/judge-assets/problems/two-sum/main.cpp",
        testcasePath: "/judge-assets/problems/two-sum/testcases.txt"
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

// await deleteWorkspace(workspace);