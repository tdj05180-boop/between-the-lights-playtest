import {office2019} from '../../office-study/space.js';
import {agency} from '../../agency-study/space.js';
export function officeSpace(isAgency=false){return isAgency?agency:office2019;}
