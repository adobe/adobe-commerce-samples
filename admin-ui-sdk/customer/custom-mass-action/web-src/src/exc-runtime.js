/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/**
 *
 * Script to load the Adobe Experience Cloud Runtime.
 *
 * @throws {Error} error in case of failure, most likely when the app is not running in
 * the Experience Cloud Shell.
 *
 */
/* eslint-disable-next-line */
(function(e,t){if(t.location===t.parent.location)throw new Error("Module Runtime: Needs to be within an iframe!");var o=function(e){var t=new URL(e.location.href).searchParams.get("_mr");return t||!e.EXC_US_HMR?t:e.sessionStorage.getItem("unifiedShellMRScript")}(t);if(!o)throw new Error("Module Runtime: Missing script!");if("https:"!==(o=new URL(decodeURIComponent(o))).protocol)throw new Error("Module Runtime: Must be HTTPS!");if(!/^(exc-unifiedcontent\.)?experience(-qa|-stage|-cdn|-cdn-stage)?\.adobe\.(com|net)$/.test(o.hostname)&&!/localhost\.corp\.adobe\.com$/.test(o.hostname))throw new Error("Module Runtime: Invalid domain!");if(!/\.js$/.test(o.pathname))throw new Error("Module Runtime: Must be a JavaScript file!");t.EXC_US_HMR&&t.sessionStorage.setItem("unifiedShellMRScript",o.toString());var n=e.createElement("script");n.async=1,n.src=o.toString(),n.onload=n.onreadystatechange=function(){n.readyState&&!/loaded|complete/.test(n.readyState)||(n.onload=n.onreadystatechange=null,n=void 0,"EXC_MR_READY"in t&&t.EXC_MR_READY())},e.head.appendChild(n)})(document,window);
