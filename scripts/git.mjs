// Trust only this known local checkout for the current Git invocation.
// Useful when Windows created the folder under a different execution account.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const result=spawnSync('git',['-c','safe.directory='+root,...(args.length?args:['status'])],{cwd:root,stdio:'inherit',windowsHide:true});
if(result.error){console.error(result.error.message);process.exitCode=1;}else process.exitCode=result.status??1;
