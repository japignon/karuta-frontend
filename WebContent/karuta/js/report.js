/* =======================================================
	Copyright 2018 - ePortfolium - Licensed under the
	Educational Community License, Version 2.0 (the "License"); you may
	not use this file except in compliance with the License. You may
	obtain a copy of the License at

	http://opensource.org/licenses/ECL-2.0

	Unless required by applicable law or agreed to in writing,
	software distributed under the License is distributed on an "AS IS"
	BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
	or implied. See the License for the specific language governing
	permissions and limitations under the License.
   ======================================================= */

var trace = false;
var xmlDoc = null;
var userid = null; // current user
var aggregates = {};
var variables = {};
var refresh = true;
var csvline = "";

var csvreport = null;
var report_not_in_a_portfolio = false;

var dashboard_infos = {};
var dashboard_current = null;
var portfolioid_current = null;


var jquerySpecificFunctions = {};
jquerySpecificFunctions['.sortResource()'] = ".sort(function(a, b){ return $(\"text[lang='#lang#']\",$(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']\",$(a))).text() > $(\"text[lang='#lang#']\",$(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']\",$(b))).text() ? 1 : -1; })";
jquerySpecificFunctions['.sortResource(#'] = ".sort(function(a, b){ return $(\"#1[lang='#lang#']\",$(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']\",$(a))).text() > $(\"#1[lang='#lang#']\",$(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']\",$(b))).text() ? 1 : -1; })";
jquerySpecificFunctions['.invsortResource()'] = ".sort(function(a, b){ return $(\"text[lang='#lang#']\",$(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']\",$(a))).text() > $(\"text[lang='#lang#']\",$(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']\",$(b))).text() ? -1 : 1; })";
jquerySpecificFunctions['.sort()'] = ".sort(function(a, b){ return $(a).text() < $(b).text() ? -1 : 1; })";
jquerySpecificFunctions['.invsort()'] = ".sort(function(a, b){ return $(a).text() < $(b).text() ? 1 : -1; })";
jquerySpecificFunctions['.filename_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > filename[lang='#lang#']:not(:empty)\")";
jquerySpecificFunctions['.filename_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > filename[lang='#lang#']:empty\")";
jquerySpecificFunctions['.url_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > url[lang='#lang#']:not(:empty)\")";
jquerySpecificFunctions['.url_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > url[lang='#lang#']:empty\")";
jquerySpecificFunctions['.text_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > text[lang='#lang#']:not(:empty)\")";
jquerySpecificFunctions['.text_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > text[lang='#lang#']:empty\")";
jquerySpecificFunctions['.submitted()'] = ".has(\"metadata-wad[submitted='Y']\")";
jquerySpecificFunctions['.code_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > code:empty\")";
jquerySpecificFunctions['.filename_or_url_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > filename[lang='#lang#']:not(:empty)\",\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > url[lang='#lang#']:not(:empty)\")";
jquerySpecificFunctions['.filename_or_text_or_url_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > filename[lang='#lang#']:not(:empty)\",\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > text[lang='#lang#']:not(:empty)\",\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > url[lang='#lang#']:empty\")";
jquerySpecificFunctions['.filename_or_text_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > filename[lang='#lang#']:not(:empty)\",\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > text[lang='#lang#']:not(:empty)\")";
jquerySpecificFunctions['.url_or_text_not_empty()'] = ".has(\"asmResource[xsi_type!='context'][xsi_type!='nodeRes'] > url[lang='#lang#']:not(:empty)\",\"asmResource[xsi_type!='context'][xsi_type!='nodeRes']  > text[lang='#lang#']:not(:empty)\")";

Selector = function(jquery,type,filter1,filter2)
{
	this.jquery = jquery;
	this.type = type;
	this.filter1 = filter1;
	this.filter2 = filter2;
};

//==================================
function r_getSelector(select,test)
//==================================
{
	if (test==null)
	 test = "";
	var selects = select.split("."); // nodetype.semtag.[node|resource] or .[node|resource]
	if (selects[0]=="")
		selects[0] = "*";
	var jquery = selects[0];
	var filter1 = null;
	var filter2 = null;
	if (selects[1]!="") {
		jquery +=":has(metadata[semantictag*='"+selects[1]+"'])";
		filter1 = function(){return $(this).children("metadata[semantictag*='"+selects[1]+"']").length>0};
	}
	var filter2 = test; // test = .has("metadata-wad[submitted='Y']").last()
	for (fct in jquerySpecificFunctions) {
		if (test.indexOf(fct)>-1) {
			filter2 = filter2.replace(fct,jquerySpecificFunctions[fct]);
			if (filter2.indexOf("#lang#")>-1)
				filter2 = filter2.replace(/#lang#/g,languages[LANGCODE]);
			if (test.indexOf("sortResource(#")>-1){
				var1 = test.substring(test.indexOf("(#")+1,test.lastIndexOf(")"));
				filter2 = filter2.replace(/#1/g,var1);
			}
		}
	}
	var type = "";
	if (selects.length>2)
		type = selects[2];
	var selector = new Selector(jquery,type,filter1,filter2);
	return selector;
}

//==================================
function r_processPortfolio(no,xmlReport,destid,data,line)
//==================================
{
	$.ajaxSetup({async: false});
	if (no==0){
		dashboard_current = destid;
		dashboard_infos[destid] = {'xmlReport':xmlReport,'data':data};
	}
	var children = $(":root",xmlReport).children();
//	var children = $(">*",xmlReport);
	no += destid;
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="table")
			r_processTable(no+"_"+i,children[i],destid,data,line);
		if (tagname=="row")
			r_processRow(no+"_"+i,children[i],destid,data,line);
		if (tagname=="cell")
			r_processCell(no+"_"+i,children[i],destid,data,line);
		if (tagname=="node_resource")
			r_processNodeResource(children[i],destid,data,line);
		if (tagname=="text")
			r_processText(children[i],destid,data,line);
		if (tagname=="url2unit")
			r_processURL2Unit(children[i],destid,data,line);
		if (tagname=="jsfunction")
			r_processJSFunction(children[i],destid,data,line);
		if (tagname=="draw-web-axis")
			r_processWebAxis(children[i],destid,nodes[i],i);
		if (tagname=="draw-web-line")
			r_processWebLine(children[i],destid,nodes[i],i);
		if (tagname=="loop")
			r_processLoop(no+"_"+i,children[i],destid,data,line);
		if (tagname=="for-each-node")
			r_processNode(no+"_"+i,children[i],destid,data,line);
		if (tagname=="for-each-portfolio")
			r_getPortfolios(no+"_"+i,children[i],destid,data,line);
		if (tagname=="for-each-portfolios-nodes")
			r_getPortfoliosNodes(no+"_"+i,children[i],destid,data,line);
		if (tagname=="europass")
			r_processEuropass(children[i],destid,data,line);
		if (tagname=="csv-line")
			r_processCsvLine(no+"_"+i,children[i],destid,data,line);
		if (tagname=="csv-value")
			r_processCsvValue(destid,data,line);
	}
	$.ajaxSetup({async: true});
}

//==================================
function r_report_process(xmlDoc,json)
//==================================
{
	$.ajaxSetup({async: false});
	var children = $(":root",xmlDoc).children();
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="for-each-line")
			r_processLine(i,children[i],'report-content');
		if (tagname=="for-each-person")
			r_getUsers(i,children[i],'report-content');
		if (tagname=="for-each-portfolio")
			r_getPortfolios(i,children[i],'report-content');
		if (tagname=="for-each-portfolios-nodes")
			r_getPortfoliosNodes(i,children[i],'report-content');
		if (tagname=="loop")
			r_processLoop(i,children[i],'report-content');
		if (tagname=="table")
			r_processTable(i,children[i],'report-content');
		if (tagname=="europass")
			r_processEuropass(i,children[i],'report-content');
		if (tagname=="aggregate")
			r_processAggregate(children[i],'report-content');
		if (tagname=="text")
			r_processText(children[i],'report-content');
		if (tagname=="url2unit")
			r_processURL2Unit(children[i],'report-content');
		if (tagname=="jsfunction")
			r_processJSFunction(children[i],'report-content');
	}
	$.ajaxSetup({async: true});
}

//==================================
function r_processLine(no,xmlDoc,destid,data,line)
//==================================
{
	var ref_init = $(xmlDoc).attr("ref-init");
	//---------------------
	var children = $(">*",xmlDoc);
	$("#line-number").html('0');
	$("#number_lines").html(json.lines.length);
	for (var i=0; i<json.lines.length; i++){
		if (ref_init!=undefined) {
			$("#line-number").html(i+1);
			var ref_inits = ref_init.split("/"); // ref1/ref2/...
			for (var k=0;k<ref_inits.length;k++)
				aggregates[ref_inits[k]] = new Array();
		}
		for (var j=0; j<children.length;j++){
			var tagname = $(children[j])[0].tagName;
			if (tagname=="for-each-person")
				r_getUsers(no+"_"+i,children[j],destid,data,i);
			if (tagname=="for-each-portfolio")
				r_getPortfolios(no+"_"+i,children[j],destid,data,i);
			if (tagname=="for-each-portfolios-nodes")
				r_getPortfoliosNodes(no+"_"+i,children[j],destid,data,i);
			if (tagname=="table")
				r_processTable(no+"_"+i,children[j],destid,data,i);
			if (tagname=="loop")
				r_processLoop(no+"_"+i,children[j],destid,data,i);
			if (tagname=="row")
				r_processRow(no+"_"+i,children[j],destid,data,i);
			if (tagname=="aggregate")
				r_processAggregate(children[i],destid,data,i);
			if (tagname=="csv-line")
				r_processCsvLine(no+"_"+i,children[j],destid,data,i);
			if (tagname=="csv-value")
				r_processCsvValue(children[j],destid,data,i);
		}
	}
}

//=============================================================================
//=============================================================================
//======================= FOR-EACH-NODE =====================================
//=============================================================================
//=============================================================================

//==================================
function r_processNode(no,xmlDoc,destid,data,line)
//==================================
{
	var select = $(xmlDoc).attr("select");
	var test = $(xmlDoc).attr("test");
	if (select!=undefined) {
		var selector = r_getSelector(select,test);
		var nodeold = $(selector.jquery,data);
		var nodes = $(selector.jquery,data).filter(selector.filter1);
		while (selector.filter2.indexOf("##")>-1) {
			var test_string = selector.filter2.substring(selector.filter2.indexOf("##")+2); // test_string = variable##.....
			var variable_name = test_string.substring(0,test_string.indexOf("##"));
			selector.filter2 = selector.filter2.replace("##"+variable_name+"##", variables[variable_name]);
		}
		nodes = eval("nodes"+selector.filter2);
		if (nodes.length==0) { // try the node itself
			var nodes = $(selector.jquery,data).addBack().filter(selector.filter1);
			nodes = eval("nodes"+selector.filter2);
		}
		for (var i=0; i<nodes.length;i++){
			//---------------------------
			var ref_init = $(xmlDoc).attr("ref-init");
			if (ref_init!=undefined) {
				var ref_inits = ref_init.split("/"); // ref1/ref2/...
				for (var k=0;k<ref_inits.length;k++)
					aggregates[ref_inits[k]] = new Array();
			}
			//---------------------------
			var children = $(">*",xmlDoc);
			for (var j=0; j<children.length;j++){
				var tagname = $(children[j])[0].tagName;
				if (tagname=="for-each-node")
					r_processNode(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="loop")
					r_processLoop(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="table")
					r_processTable(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="row")
					r_processRow(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="cell")
					r_processCell(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="aggregate")
					r_processAggregate(children[j],destid,nodes[i],i);
				if (tagname=="node_resource")
					r_processNodeResource(children[j],destid,nodes[i],i);
				if (tagname=="text")
					r_processText(children[j],destid,nodes[i],i);
				if (tagname=="url2unit")
					r_processURL2Unit(children[j],destid,nodes[i],i);
				if (tagname=="jsfunction")
					r_processJSFunction(children[j],destid,nodes[i],i);
				if (tagname=="draw-web-axis")
					r_processWebAxis(children[j],destid,nodes[i],i);
				if (tagname=="draw-web-line")
					r_processWebLine(children[j],destid,nodes[i],i);
				if (tagname=="aggregate")
					r_processAggregate(children[j],destid,nodes[i],i);
				if (tagname=="goparent")
					r_processGoParent(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="csv-line")
					r_processCsvLine(no+"_"+i+"_"+j,children[j],destid,nodes[i],i);
				if (tagname=="csv-value")
					r_processCsvValue(children[j],destid,nodes[i],i);
			}
		};
	}
}

//==================================
function r_processLoop(no,xmlDoc,destid,data,line)
//==================================
{
	var first = parseInt($(xmlDoc).attr("first"));
	var last = parseInt($(xmlDoc).attr("last"));
	for (var i=first; i<last+1;i++){
		//---------------------------
		var variable = $(xmlDoc).attr("variable");
		if (variable!=undefined) {
				variables[variable] = i;
		}
		//---------------------------
		var ref_init = $(xmlDoc).attr("ref-init");
		if (ref_init!=undefined) {
			var ref_inits = ref_init.split("/"); // ref1/ref2/...
			for (var k=0;k<ref_inits.length;k++)
				aggregates[ref_inits[k]] = new Array();
		}
		//---------------------------
		var children = $(">*",xmlDoc);
		for (var j=0; j<children.length;j++){
			var tagname = $(children[j])[0].tagName;
			if (tagname=="for-each-node")
				r_processNode(no+"_"+i+"_"+j,children[j],destid,data,i);
			if (tagname=="table")
				r_processTable(no+"_"+i+"_"+j,children[j],destid,data,i);
			if (tagname=="row")
				r_processRow(no+"_"+i+"_"+j,children[j],destid,data,i);
			if (tagname=="cell")
				r_processCell(no+"_"+i+"_"+j,children[j],destid,data,i);
			if (tagname=="aggregate")
				r_processAggregate(children[j],destid,data,i);
			if (tagname=="node_resource")
				r_processNodeResource(children[j],destid,data,i);
			if (tagname=="text")
				r_processText(children[j],destid,data,i);
			if (tagname=="url2unit")
				r_processURL2Unit(children[j],destid,data,i);
			if (tagname=="jsfunction")
				r_processJSFunction(children[j],destid,data,i);
			if (tagname=="draw-web-axis")
				r_processWebAxis(children[j],destid,data,i);
			if (tagname=="draw-web-line")
				r_processWebLine(children[j],destid,data,i);
			if (tagname=="aggregate")
				r_processAggregate(children[j],destid,data,i);
			if (tagname=="goparent")
				r_processGoParent(no+"_"+i+"_"+j,children[j],destid,data,i);
		}
	};
}

//==================================
function r_processGoParent(no,xmlDoc,destid,data,line)
//==================================
{
	var parent = $(data).parent();
	//---------------------------
	var children = $(">*",xmlDoc);
	var i=0;
	for (var j=0; j<children.length;j++){
		var tagname = $(children[j])[0].tagName;
		if (tagname=="for-each-node")
			r_processNode(no+"_"+i+"_"+j,children[j],destid,parent,i);
		if (tagname=="table")
			r_processTable(no+"_"+i+"_"+j,children[j],destid,parent,i);
		if (tagname=="row")
			r_processRow(no+"_"+i+"_"+j,children[j],destid,parent,i);
		if (tagname=="cell")
			r_processCell(no+"_"+i+"_"+j,children[j],destid,parent,i);
		if (tagname=="aggregate")
			r_processAggregate(children[j],destid,parent,i);
		if (tagname=="node_resource")
			r_processNodeResource(children[j],destid,parent,i);
		if (tagname=="text")
			r_processText(children[j],destid,parent,i);
		if (tagname=="url2unit")
			r_processURL2Unit(children[j],destid,parent,i);
		if (tagname=="jsfunction")
			r_processJSFunction(children[j],destid,parent,i);
		if (tagname=="draw-web-axis")
			r_processWebAxis(children[j],destid,parent,i);
		if (tagname=="draw-web-line")
			r_processWebLine(children[j],destid,parent,i);
		if (tagname=="aggregate")
			r_processAggregate(children[j],destid,parent,i);
		if (tagname=="goparent")
			r_processGoParent(no+"_"+i+"_"+j,children[j],destid,parent,i);
	}
}

//==================================
function r_processSVG(no,xmlDoc,destid,data,line)
//==================================
{
	var min_height = $(xmlDoc).attr("min-height");
	var min_width = $(xmlDoc).attr("min-width");
	var html = "<svg id='svg_"+no+"' min-width='"+min_width+"' min-height='"+min_height+"' viewbox='0 0 1000 1000'></svg>";
	var svg = $(html);
	$("#"+destid).append(svg);
	var children = $(">*",xmlDoc);
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="draw-web-title")
			r_processWebTitle(children[i],'svg_'+no,data,line);
		if (tagname=="draw-web-axis")
			r_processWebAxis(children[i],'svg_'+no,data,line);
		if (tagname=="draw-web-line")
			r_processWebLine(children[i],'svg_'+no,data,line);
		if (tagname=="for-each-node")
			r_processNode(no+"_"+i,children[i],'svg_'+no,data,line);
		if (tagname=="goparent")
			r_processGoParent(no+"_"+i,children[i],'svg_'+no,data,line);
	}
}

//==================================
function r_processShowSharing(destid)
//==================================
{
	$.ajax({
		type : "GET",
		dataType : "xml",
		url : serverBCK_API+"/rolerightsgroups/all/users?portfolio="+portfolioid_current,
		success : function(data) {
			UIFactory["Portfolio"].displayUnSharing(destid,data,true);
		},
		error : function(jqxhr,textStatus) {
			alertHTML("Error in r_processShowSharing : "+jqxhr.responseText);
		}
	});
}


//==================================
function r_processTable(no,xmlDoc,destid,data,line)
//==================================
{
	//---------------------------
	var ref_init = $(xmlDoc).attr("ref-init");
	if (ref_init!=undefined) {
		var ref_inits = ref_init.split("/"); // ref1/ref2/...
		for (var k=0;k<ref_inits.length;k++)
			aggregates[ref_inits[k]] = new Array();
	}
	//---------------------------
	var style = $(xmlDoc).attr("style");
	var html = "<table id='table_"+no+"' style='"+style+"'></table>";
	$("#"+destid).append($(html));
	var children = $(">*",xmlDoc);
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="for-each-line")
			r_processLine(no+"_"+i,children[i],'table_'+no,data,'table_'+no);
		if (tagname=="for-each-person")
			r_getUsers(no+"_"+i,children[i],'table_'+no,data,line);
		if (tagname=="for-each-portfolio")
			r_getPortfolios(no+"_"+i,children[i],'table_'+no,data,line);
		if (tagname=="for-each-portfolios-nodes")
			r_getPortfoliosNodes(no+"_"+i,children[i],'table_'+no,data,line);
		if (tagname=="row")
			r_processRow(no+"_"+i,children[i],'table_'+no,data,line);
		if (tagname=="for-each-node")
			r_processNode(no+"_"+i,children[i],'table_'+no,data,line);
		if (tagname=="loop")
			r_processLoop(no+"_"+i,children[i],'table_'+no,data,line);
		if (tagname=="goparent")
			r_processGoParent(no+"_"+i,children[i],'table_'+no,data,line);
	};
}

//==================================
function r_processRow(no,xmlDoc,destid,data,line)
//==================================
{
	//---------------------------
	var ref_init = $(xmlDoc).attr("ref-init");
	if (ref_init!=undefined) {
		var ref_inits = ref_init.split("/"); // ref1/ref2/...
		for (var k=0;k<ref_inits.length;k++)
			aggregates[ref_inits[k]] = new Array();
	}
	//---------------------------
	var style = $(xmlDoc).attr("style");
	var html = "<tr id='tr_"+no+"' style='"+style+"'></tr>";
	$("#"+destid).append($(html));
	var children = $(">*",xmlDoc);
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="for-each-person")
			r_getUsers(no,children[i],'tr_'+no,data,line);
		if (tagname=="for-each-portfolio")
			r_getPortfolios(no,children[i],'tr_'+no,data,line);
		if (tagname=="for-each-portfolios-nodes")
			r_getPortfoliosNodes(no,children[i],'tr_'+no,data,line);
		if (tagname=="cell")
			r_processCell(no+"_"+i,children[i],'tr_'+no,data,line);
		if (tagname=="for-each-node")
			r_processNode(no+"_"+i,children[i],'tr_'+no,data,line);
		if (tagname=="loop")
			r_processLoop(no+"_"+i,children[i],'tr_'+no,data,line);
		if (tagname=="goparent")
			r_processGoParent(no+"_"+i,children[i],'tr_'+no,data,line);
	}
}

//==================================
function r_processCell(no,xmlDoc,destid,data,line)
//==================================
{
	var style = $(xmlDoc).attr("style");
	var attr_help = $(xmlDoc).attr("help");
	var colspan = $(xmlDoc).attr("colspan");

	var html = "<td id='td_"+no+"' style='"+style+"' ";
	if (colspan!=null && colspan!='0')
		html += "colspan='"+colspan+"' "
	html += "><span id='help_"+no+"' class='ihelp'></span>";
	html += "</td>";
	$("#"+destid).append($(html));
	if (attr_help!=undefined && attr_help!="") {
		var help_text = "";
		var helps = attr_help.split("//"); // lang1/lang2/...
		if (attr_help.indexOf("@")>-1) { // lang@fr/lang@en/...
			for (var j=0; j<helps.length; j++){
				if (helps[j].indexOf("@"+languages[LANGCODE])>-1)
					help_text = helps[j].substring(0,helps[j].indexOf("@"));
			}
		} else { // lang1/lang2/...
			help_text = helps[langcode];  // lang1/lang2/...
		}
		var help = " <a href='javascript://' class='popinfo'><span style='font-size:12px' class='glyphicon glyphicon-question-sign'></span></a> ";
		$("#help_"+no).html(help);
		$(".popinfo").popover({ 
		    placement : 'bottom',
		    container : 'body',
		    title:karutaStr[LANG]['help-label'],
		    html : true,
		    trigger:'click hover',
		    content: help_text
		});
	}
	var children = $(">*",xmlDoc);
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="for-each-person")
			r_getUsers(no,children[i],'td_'+no,data,line);
		if (tagname=="for-each-portfolio")
			r_getPortfolios(no,children[i],'td_'+no,data,line);
		if (tagname=="for-each-portfolios-nodes")
			r_getPortfoliosNodes(no,children[i],'td_'+no,data,line);
		if (tagname=="table")
			r_processTable(no,children[i],'td_'+no,data,line);
		if (tagname=="node_resource")
			r_processNodeResource(children[i],'td_'+no,data,line);
		if (tagname=="text")
			r_processText(children[i],'td_'+no,data,line);
		if (tagname=="url2unit")
			r_processURL2Unit(children[i],'td_'+no,data,line);
		if (tagname=="jsfunction")
			r_processJSFunction(children[i],'td_'+no,data,line);
		if (tagname=="draw-web-axis")
			r_processWebAxis(children[i],'td_'+no,data,line);
		if (tagname=="draw-web-line")
			r_processWebLine(children[i],'td_'+no,data,line);
		if (tagname=="aggregate")
			r_processAggregate(children[i],'td_'+no,data,line);
		if (tagname=="svg")
			r_processSVG(no,children[i],'td_'+no,data,line);
		if (tagname=="for-each-node")
			r_processNode(no,children[i],'td_'+no,data,line);
		if (tagname=="loop")
			r_processLoop(no,children[i],'td_'+no,data,line);
		if (tagname=="europass")
			r_processEuropass(children[i],'td_'+no,data);
		if (tagname=="goparent")
			r_processGoParent(no,children[i],'td_'+no,data,line);
		if (tagname=="show-sharing")
			r_processShowSharing('td_'+no);
		if (tagname=="qrcode")
			r_processQRcode(children[i],'td_'+no,data);
	}
}

//=============================================================================
//=============================================================================
//======================= FOR-EACH-PERSON =====================================
//=============================================================================
//=============================================================================

//==================================
function r_getUsers(no,xmlDoc,destid,data,line)
//==================================
{
	var ref_init = $(xmlDoc).attr("ref-init");
	if (ref_init!=undefined) {
		var ref_inits = ref_init.split("/"); // ref1/ref2/...
		for (var i=0;i<ref_inits.length;i++)
			aggregates[ref_inits[i]] = new Array();
	}
	$.ajax({
		type : "GET",
		dataType : "xml",
		url : serverBCK_API+"/users",
		success : function(data) {
			r_processUsers(no,xmlDoc,destid,data,line);
		}
	});
}

//==================================
function r_processUsers(no,xmlDoc,destid,data,line)
//==================================
{
	UIFactory["User"].parse(data);
	var select = $(xmlDoc).attr("select");
	var value = "";
	if (select.indexOf("username=")>-1)
		if (select.indexOf("'")>-1)
			value = select.substring(10,select.length-1);  // inside quote
		else
			value = eval("json.lines["+line+"]."+select.substring(9));
	var condition = false;
	for ( var j = 0; j < UsersActive_list.length; j++) {
		var username = UsersActive_list[j].username_node.text();
		if (select.indexOf("username=")>-1) {
			condition = username.indexOf(value)>-1;
		}
		//------------------------------------
		if (condition){
			userid = UsersActive_list[j].id;
			var children = $(">*",xmlDoc);
			for (var i=0; i<children.length;i++){
				var tagname = $(children[i])[0].tagName;
				if (tagname=="for-each-portfolio")
					r_getPortfolios(no+"_"+j,children[i],destid,data,line);
				if (tagname=="for-each-portfolios-nodes")
					r_getPortfoliosNodes(no+"_"+j,children[i],destid,data,line);
				if (tagname=="table")
					r_processTable(no+"_"+j,children[i],destid,data,line);
				if (tagname=="row")
					r_processRow(no+"_"+j,children[i],destid,data,line);
				if (tagname=="cell")
					r_processCell(no+"_"+j,children[i],destid,data,line);
				if (tagname=="node_resource")
					r_processNodeResource(children[i],destid,data,line);
				if (tagname=="jsfunction")
					r_processJSFunction(children[i],destid,data,line);
				if (tagname=="draw-web-axis")
					r_processWebAxis(children[i],destid,data,line);
				if (tagname=="draw-web-line")
					r_processWebLine(children[i],destid,data,line);
				if (tagname=="text")
					r_processText(children[i],destid,data,line);
				if (tagname=="for-each-node")
					r_processNode(no+"_"+j,children[i],destid,data,line);
				if (tagname=="loop")
					r_processLoop(no+"_"+j,children[i],destid,data,line);
				if (tagname=="csv-line")
					r_processCsvLine(no+"_"+j,children[i],destid,data,line);
				if (tagname=="csv-value")
					r_processCsvValue(children[i],destid,data,line);
			}
		}
			//------------------------------------
	}
}

//=============================================================================
//=============================================================================
//======================FOR-EACH-PORTFOLIO ====================================
//=============================================================================
//=============================================================================

//==================================
function r_getPortfolios(no,xmlDoc,destid,data,line)
//==================================
{
	var ref_init = $(xmlDoc).attr("ref-init");
	if (ref_init!=undefined) {
		var ref_inits = ref_init.split("/"); // ref1/ref2/...
		for (var i=0;i<ref_inits.length;i++)
			aggregates[ref_inits[i]] = new Array();
	}
	if (userid==null)
		userid = USER.id;
	$.ajax({
		type : "GET",
		dataType : "xml",
		url : serverBCK_API+"/portfolios?active=1&user="+userid,
		success : function(data) {
			r_processPortfolios(no,xmlDoc,destid,data,line);
		}
	});
}

//==================================
function r_processPortfolios(no,xmlDoc,destid,data,line)
//==================================
{
	UIFactory["Portfolio"].parse(data);
	var select = $(xmlDoc).attr("select");
	while (select.indexOf("##")>-1) {
		var test_string = select.substring(select.indexOf("##")+2); // test_string = abcd##variable##efgh.....
		var variable_name = test_string.substring(0,test_string.indexOf("##"));
		select = select.replace("##"+variable_name+"##", variables[variable_name]);
	}
	var value = "";
	var condition = "";
	var portfolioid = "";
	//----------------------------------
	var sortag = $(xmlDoc).attr("sortag");
	var sortelt = $(xmlDoc).attr("sortelt");
	var tableau = new Array();
	var sortvalue = "";
	if (sortag!=undefined && sortag!="") {
		for ( var j = 0; j < portfolios_list.length; j++) {
			portfolioid = portfolios_list[j].id;
			var code = portfolios_list[j].code_node.text();
			//------------------------------------
			if (select.indexOf("code*=")>-1) {
				if (select.indexOf("'")>-1)
					value = select.substring(7,select.length-1);  // inside quote
				else if (select.indexOf("//")>-1)
					value = eval("json."+select.substring(8));
				else
					value = eval("json.lines["+line+"]."+select.substring(6));
				condition = code.indexOf(value)>-1;
			}
			if (select.indexOf("code=")>-1) {
				if (select.indexOf("'")>-1)
					value = select.substring(6,select.length-1);  // inside quote
				else if (select.indexOf("//")>-1)
					value = eval("json."+select.substring(7));
				else
					value = eval("json.lines["+line+"]."+select.substring(5));
				condition = code==value;
			}
			if (select.length==0) {
				condition = true;;
			}
			//------------------------------------
			if (condition && sortag!=""){
				$.ajax({
					type : "GET",
					dataType : "xml",
					url : serverBCK_API+"/nodes?portfoliocode=" + code + "&semtag="+sortag,
					success : function(data) {
						var text = ";"
						if (sortelt=='resource code') {
							sortvalue = $("code",data)[0].text();
						}
						if (sortelt=='value') {
							sortvalue = $("value",data)[0].text();
						}
						if (sortelt=='node label') {
							sortvalue = $("label[lang='"+languages[LANGCODE]+"']",data)[0].text();
						}
						if (sortelt=='resource') {
							sortvalue = $("text[lang='"+languages[LANGCODE]+"']",$("asmResource[xsi_type!='nodeRes'][xsi_type!='context']",data)).text();
						}
						tableau[tableau.length] = [sortvalue,portfolioid];
					}
				});
			}
			//------------------------------------
		}
		var newTableau = tableau.sort(sortOn1);
		for ( var i = 0; i < newTableau.length; i++) {
			portfolios_list[i] = portfolios_byid[newTableau[i][1]]
		}
		portfolios_list.length = newTableau.length;
	}
	//----------------------------------
	for ( var j = 0; j < portfolios_list.length; j++) {
		var code = portfolios_list[j].code_node.text();
		//------------------------------------
		if (select.indexOf("code*=")>-1) {
			if (select.indexOf("'")>-1)
				value = select.substring(7,select.length-1);  // inside quote
			else if (select.indexOf("//")>-1)
				value = eval("json."+select.substring(8));
			else
				value = eval("json.lines["+line+"]."+select.substring(6));
			condition = code.indexOf(value)>-1;
		}
		if (select.indexOf("code=")>-1) {
			if (select.indexOf("'")>-1)
				value = select.substring(6,select.length-1);  // inside quote
			else if (select.indexOf("//")>-1)
				value = eval("json."+select.substring(7));
			else
				value = eval("json.lines["+line+"]."+select.substring(5));
			condition = code==value;
		}
		if (select.length==0) {
			condition = true;;
		}
		//------------------------------------
		if (condition){
			portfolioid = portfolios_list[j].id;
			portfolioid_current = portfolioid;
			$.ajax({
				type : "GET",
				dataType : "xml",
				j : j,
				url : serverBCK_API+"/portfolios/portfolio/" + portfolioid + "?resources=true",
				success : function(data) {
					if (report_not_in_a_portfolio){
						UICom.structure["tree"] = {};
						UICom.structure["ui"] = {};
					}
					UICom.parseStructure(data,true, null, null,true);
					var children = $(">*",xmlDoc);
					for (var i=0; i<children.length;i++){
						var tagname = $(children[i])[0].tagName;
						if (tagname=="table")
							r_processTable(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="row")
							r_processRow(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="cell")
							r_processCell(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="node_resource")
							r_processNodeResource(children[i],destid,data,line);
						if (tagname=="jsfunction")
							r_processJSFunction(children[i],destid,data,line);
						if (tagname=="text")
							r_processText(children[i],destid,data,line);
						if (tagname=="for-each-node")
							r_processNode(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="loop")
							r_processLoop(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="draw-web-axis")
							r_processWebAxis(children[i],destid,data,line);
						if (tagname=="draw-web-line")
							r_processWebLine(children[i],destid,data,line);
						if (tagname=="csv-line")
							r_processCsvLine(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="csv-value")
							r_processCsvValue(children[i],destid,data,line);
					}
				}
			});
		}
			//------------------------------------
	}
}

//=============================================================================
//=============================================================================
//======================FOR-EACH-PORTFOLIO-NODE ===============================
//=============================================================================
//=============================================================================

//==================================
function r_getPortfoliosNodes(no,xmlDoc,destid,data,line)
//==================================
{
	var ref_init = $(xmlDoc).attr("ref-init");
	if (ref_init!=undefined) {
		var ref_inits = ref_init.split("/"); // ref1/ref2/...
		for (var i=0;i<ref_inits.length;i++)
			aggregates[ref_inits[i]] = new Array();
	}
	if (userid==null)
		userid = USER.id;
	$.ajax({
		type : "GET",
		dataType : "xml",
		url : serverBCK_API+"/portfolios?active=1&user="+userid,
		success : function(data) {
			r_processPortfoliosNodes(no,xmlDoc,destid,data,line);
		}
	});
}

//==================================
function r_processPortfoliosNodes(no,xmlDoc,destid,data,line)
//==================================
{
	UIFactory["Portfolio"].parse(data);
	var select = $(xmlDoc).attr("select");
	var value = "";
	var condition = "";
	var portfolioid = "";
	//----------------------------------
	var nodetag = $(xmlDoc).attr("nodetag");
	var sortag = $(xmlDoc).attr("sortag");
	var sortelt = $(xmlDoc).attr("sortelt");
	var tableau = new Array();
	var sortvalue = "";
	if (sortag!=undefined && sortag!="") {
		for ( var j = 0; j < portfolios_list.length; j++) {
			portfolioid = portfolios_list[j].id;
			var code = portfolios_list[j].code_node.text();
			if (select.indexOf("code*=")>-1) {
				if (select.indexOf("'")>-1)
					value = select.substring(7,select.length-1);  // inside quote
				else
					value = eval("json.lines["+line+"]."+select.substring(6));
				condition = code.indexOf(value)>-1;
			}
			if (select.indexOf("code=")>-1) {
				if (select.indexOf("'")>-1)
					value = select.substring(6,select.length-1);  // inside quote
				else
					value = eval("json.lines["+line+"]."+select.substring(5));
				condition = code==value;
			}
			//------------------------------------
			if (condition && sortag!=""){
				$.ajax({
					type : "GET",
					dataType : "xml",
					url : serverBCK_API+"/nodes?portfoliocode=" + code + "&semtag="+sortag,
					success : function(data) {
						var text = ";"
						if (sortelt=='resource code') {
							sortvalue = $("code",data)[0].text();
						}
						if (sortelt=='value') {
							sortvalue = $("value",data)[0].text();
						}
						if (sortelt=='node label') {
							sortvalue = $("label[lang='"+languages[LANGCODE]+"']",data)[0].text();
						}
						if (sortelt=='resource') {
							sortvalue = $("text[lang='"+languages[LANGCODE]+"']",$("asmResource[xsi_type!='nodeRes'][xsi_type!='context']",data)).text();
						}
						tableau[tableau.length] = [sortvalue,portfolioid];
					}
				});
			}
			//------------------------------------
		}
		var newTableau = tableau.sort(sortOn1);
		for ( var i = 0; i < newTableau.length; i++) {
			portfolios_list[i] = portfolios_byid[newTableau[i][1]]
		}
		portfolios_list.length = newTableau.length;
	}
	//----------------------------------
	for ( var j = 0; j < portfolios_list.length; j++) {
		var code = portfolios_list[j].code_node.text();
//		alertHTML(j+"-"+code);
		if (select.indexOf("code*=")>-1) {
			value = select.substring(7,select.length-1);  // inside quote
			condition = code.indexOf(value)>-1;
		}
		if (select.indexOf("code=")>-1) {
			value = select.substring(6,select.length-1);  // inside quote
			condition = code==value;
		}
		if (select.length==0) {
			condition = true;;
		}
		//------------------------------------
		if (condition){
			$.ajax({
				type : "GET",
				dataType : "xml",
				j : j,
				url : serverBCK_API+"/nodes?portfoliocode=" + code + "&semtag="+nodetag,
				success : function(data) {
					UICom.structure["tree"] = {};
					UICom.structure["ui"] = {};
					UICom.parseStructure(data,true, null, null,true);
					var children = $(">*",xmlDoc);
					for (var i=0; i<children.length;i++){
						var tagname = $(children[i])[0].tagName;
						if (tagname=="table")
							r_processTable(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="row")
							r_processRow(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="cell")
							r_processCell(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="node_resource")
							r_processNodeResource(children[i],destid,data,line);
						if (tagname=="jsfunction")
							r_processJSFunction(children[i],destid,data,line);
						if (tagname=="text")
							r_processText(children[i],destid,data,line);
						if (tagname=="for-each-node")
							r_processNode(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="loop")
							r_processLoop(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="draw-web-axis")
							r_processWebAxis(children[i],destid,data,line);
						if (tagname=="draw-web-line")
							r_processWebLine(children[i],destid,data,line);
						if (tagname=="csv-line")
							r_processCsvLine(no+"p_"+this.j+"_"+i,children[i],destid,data,line);
						if (tagname=="csv-value")
							r_processCsvValue(children[i],destid,data,line);
					}
				}
			});
		}
			//------------------------------------
	}
}

//=============================================================================
//=============================================================================
//====================== NodeResource =========================================
//=============================================================================
//=============================================================================

//==================================
function r_processNodeResource(xmlDoc,destid,data)
//==================================
{
	var text = "";
	var style = "";
	var attr_help = "";
	var prefix_id = "";
	try {
		var select = $(xmlDoc).attr("select");
		var ref = $(xmlDoc).attr("ref");
		var editresroles = $(xmlDoc).attr("editresroles");
		var delnoderoles = $(xmlDoc).attr("delnoderoles");
		style = $(xmlDoc).attr("style");
		var selector = r_getSelector(select);
		var node = $(selector.jquery,data);
		if (node.length==0) // try the node itself
			node = $(selector.jquery,data).addBack();
		if (select.substring(0,2)=="..") // node itself
			node = data;
		if (node.length>0 || select.substring(0,1)=="."){
			var nodeid = $(node).attr("id");
			//----------------------------
			var node = UICom.structure["ui"][nodeid];
			var writenode = ($(node.node).attr('write')=='Y')? true:false;
			if (g_designerrole || writenode) {
				writenode = (editresroles.containsArrayElt(g_userroles))? true : false;
			}
			var deletenode = ($(node.node).attr('delete')=='Y')? true:false;
			if (g_designerrole || deletenode) {
				deletenode = (delnoderoles.containsArrayElt(g_userroles))? true : false;
			}
			var inline = false;
			var inline_metadata = ($(node.metadata).attr('inline')==undefined)? '' : $(node.metadata).attr('inline');
			if (inline_metadata=='Y')
				inline = true;
			//----------------------------
			if (selector.type=='resource') {
				text = UICom.structure["ui"][nodeid].resource.getView("dashboard_"+nodeid,null,null,true);
			}
			if (selector.type=='resource code') {
				text = UICom.structure["ui"][nodeid].resource.getCode();
			}
			if (selector.type=='resource value') {
				text = UICom.structure["ui"][nodeid].resource.getValue("dashboard_value_"+nodeid);
				prefix_id += "value_";
			}
			if (selector.type=='resource label') {
				text = UICom.structure["ui"][nodeid].resource.getLabel();
			}
			if (selector.type=='node label') {
				text = UICom.structure["ui"][nodeid].getLabel();
			}
			if (selector.type=='node value') {
				text = UICom.structure["ui"][nodeid].getValue();
			}
			if (selector.type=='uuid') {
				text = nodeid;
			}
			if (selector.type=='node context') {
				text = UICom.structure["ui"][nodeid].getContext("dashboard_context_"+nodeid);
				prefix_id += "context_";
			}
			if (ref!=undefined && ref!="") {
				if (aggregates[ref]==undefined)
					aggregates[ref] = new Array();
				aggregates[ref][aggregates[ref].length] = text;
			}
			text = "<span id='dashboard_"+prefix_id+nodeid+"' style='"+style+"'>"+text+"</span>";
			if (writenode) {
				text += "<span class='button glyphicon glyphicon-pencil' data-toggle='modal' data-target='#edit-window' onclick=\"javascript:getEditBox('"+nodeid+"')\" data-title='"+karutaStr[LANG]["button-edit"]+"' data-tooltip='true' data-placement='bottom'></span>";
			}
			if (deletenode) {
				var type = UICom.structure["ui"][nodeid].asmtype;
				text += deleteButton(nodeid,type,null,null,'UIFactory.Node.reloadUnit',null,null);
			}
			//----------------------------
			if (inline & writenode) {
				//-----------------------
				if(UICom.structure["ui"][nodeid].resource!=null) {
					try {
						var test = UICom.structure["ui"][nodeid].resource.getEditor();
						text = "<span id='report_get_editor_"+nodeid+"' style='"+style+"'></span>";
					}
					catch(e) {
						text = "<span id='report_display_editor_"+nodeid+"' style='"+style+"'></span>";
					}
				}
			}
			if ($(node.metadatawad).attr('help')!=undefined && $(node.metadatawad).attr('help')!=""){
				attr_help = $(node.metadatawad).attr('help');
			}
		}
	} catch(e){
		console.log("Error in report:"+e.message);
		text = "<span id='dashboard_"+nodeid+"'>&mdash;</span>";
	}
	//------------------------------
	text += "<span id='reshelp_"+nodeid+"'></span>"
	$("#"+destid).append($(text));
	//--------------------set editor------------------------------------------
	if ($("#report_display_editor_"+nodeid).length>0) {
		UICom.structure["ui"][nodeid].resource.displayEditor("report_display_editor_"+nodeid);
	}
	if (refresh && $("#dashboard_"+prefix_id+nodeid).length>0) {
		$("#dashboard_"+prefix_id+nodeid).on('DOMSubtreeModified',function (){
			refresh_report(dashboard_current);
		});
	}
	if (refresh && $("#report_get_editor_"+nodeid).length>0) {
		$("#report_get_editor_"+nodeid).append(UICom.structure["ui"][nodeid].resource.getEditor());
		var input = $('input',$("#report_get_editor_"+nodeid));
		$(input).change(function (){
			refresh_report(dashboard_current);
		});
	}
	//--------------------help------------------------------------------
/*	if (attr_help!=undefined && attr_help!="") {
		var help_text = "";
		var helps = attr_help.split("//"); // lang1/lang2/...
		if (attr_help.indexOf("@")>-1) { // lang@fr/lang@en/...
			for (var j=0; j<helps.length; j++){
				if (helps[j].indexOf("@"+languages[LANGCODE])>-1)
					help_text = helps[j].substring(0,helps[j].indexOf("@"));
			}
		} else { // lang1/lang2/...
			help_text = helps[langcode];  // lang1/lang2/...
		}
		var help = " <a href='javascript://' class='popinfo'><span style='font-size:12px' class='glyphicon glyphicon-question-sign'></span></a> ";
		$("#reshelp_"+nodeid).html(help);
		$(".popinfo").popover({ 
		    placement : 'right',
		    container : 'body',
		    title:karutaStr[LANG]['help-label'],
		    html : true,
		    trigger:'click hover',
		    content: help_text
		});
	} */
}

//=============================================================================
//=============================================================================
//====================== CSV ==================================================
//=============================================================================
//=============================================================================

//==================================
function r_processCsvLine(no,xmlDoc,destid,data,line)
//==================================
{
	csvline = "";
	var children = $(">*",xmlDoc);
	for (var i=0; i<children.length;i++){
		var tagname = $(children[i])[0].tagName;
		if (tagname=="for-each-node")
			r_processNode(no+"_"+i,children[i],'csv_'+no,data,line);
		if (tagname=="loop")
			r_processLoop(no+"_"+i,children[i],'csv_'+no,data,line);
		if (tagname=="goparent")
			r_processGoParent(no+"_"+i,children[i],'csv_'+no,data,line);
		if (tagname=="node_resource")
			r_processNodeResource(children[i],destid,data,line);
		if (tagname=="csv-value")
			r_processCsvValue(children[i],destid,data,line);
		if (tagname=="text")
			r_processText(children[i],destid,data,line,true);
		if (tagname=="username")
			r_processAddusername(true);
		if (tagname=="firstname")
			r_processAddfirstname(true);
		if (tagname=="lastname")
			r_processAddlastname(true);
		if (tagname=="firstname-lastname")
			r_processAddfirstname_lastname(true);
	};
	csvreport[csvreport.length]=csvline;
	$.ajax({
		type : "POST",
		contentType: "text",
		dataType : "text",
		data : csvline,
		url : serverBCK+"/logging?n=1&user=false&info=false",
		success : function() {
		}
	}); 
}

//==================================
function r_processAddusername(is_out_csv,destid,data)
//==================================
{
	var text = USER.username;
	//-----------------
	if (is_out_csv!=null && is_out_csv) {
		if (typeof csvseparator == 'undefined') // for backward compatibility
			csvseparator = ";";
		csvline += text + csvseparator;		
	} else {
		var nodeid = $(data).attr("id");
		text = "<span id='"+nodeid+"'>"+text+"</span>";
		$("#"+destid).append($(text));		
	}
	//-----------------
}

//==================================
function r_processAddfirstname(is_out_csv,destid,data)
//==================================
{
	var text = USER.firstname;
	//-----------------
	if (is_out_csv!=null && is_out_csv) {
		if (typeof csvseparator == 'undefined') // for backward compatibility
			csvseparator = ";";
		csvline += text + csvseparator;		
	} else {
		var nodeid = $(data).attr("id");
		text = "<span id='"+nodeid+"'>"+text+"</span>";
		$("#"+destid).append($(text));		
	}
	//-----------------
}

//==================================
function r_processAddlastname(is_out_csv,destid,data)
//==================================
{
	var text = USER.lastname;
	//-----------------
	if (is_out_csv!=null && is_out_csv) {
		if (typeof csvseparator == 'undefined') // for backward compatibility
			csvseparator = ";";
		csvline += text + csvseparator;		
	} else {
		var nodeid = $(data).attr("id");
		text = "<span id='"+nodeid+"'>"+text+"</span>";
		$("#"+destid).append($(text));		
	}
	//-----------------
}

//==================================
function r_processAddfirstname_lastname(is_out_csv,destid,data)
//==================================
{
	var text1 = USER.firstname;
	var text2 = USER.lastname;
	//-----------------
	if (is_out_csv!=null && is_out_csv) {
		if (typeof csvseparator == 'undefined') // for backward compatibility
			csvseparator = ";";
		csvline += text1 +"-" + text2 + csvseparator;		
	} else {
		var nodeid = $(data).attr("id");
		var text = "<span id='"+nodeid+"'>"+text1 + "&nbsp" +text2 + "</span>";
		$("#"+destid).append($(text));		
	}
	//-----------------
}


//==================================
function r_processCsvValue(xmlDoc,destid,data)
//==================================
{
	var text = "";
	var style = "";
	var attr_help = "";
	var prefix_id = "";
	try {
		var select = $(xmlDoc).attr("select");
		var selector = r_getSelector(select);
		var node = $(selector.jquery,data);
		if (node.length==0) // try the node itself
			node = $(selector.jquery,data).addBack();
		if (select.substring(0,2)=="..") // node itself
			node = data;
		if (node.length>0 || select.substring(0,1)=="."){
			var nodeid = $(node).attr("id");
			//----------------------------
			var node = UICom.structure["ui"][nodeid];
			//----------------------------
			if (selector.type=='resource') {
				text = UICom.structure["ui"][nodeid].resource.getView("dashboard_"+nodeid,null,null,true);
			}
			if (selector.type=='resource code') {
				text = UICom.structure["ui"][nodeid].resource.getCode();
			}
			if (selector.type=='resource value') {
				text = UICom.structure["ui"][nodeid].resource.getValue("dashboard_value_"+nodeid);
				prefix_id += "value_";
			}
			if (selector.type=='resource label') {
				text = UICom.structure["ui"][nodeid].resource.getLabel();
			}
			if (selector.type=='node label') {
				text = UICom.structure["ui"][nodeid].getLabel();
			}
			if (selector.type=='node value') {
				text = UICom.structure["ui"][nodeid].getValue();
			}
			if (selector.type=='uuid') {
				text = nodeid;
			}
			if (selector.type=='node context') {
				text = UICom.structure["ui"][nodeid].getContext("dashboard_context_"+nodeid);
			}
		}
	} catch(e){
		text = "-";
	}
	//------------------------------
	if (typeof csvseparator == 'undefined') // for backward compatibility
		csvseparator = ";";
	csvline += text + csvseparator;
}

//=============================================================================
//=============================================================================
//====================== QRCODE ===============================================
//=============================================================================
//=============================================================================

//==================================
function r_processQRcode(xmlDoc,destid,data)
//==================================
{
	var text = "";
	var style = "";
	var attr_help = "";
	try {
		var selector = r_getSelector('asmContext.qrcode','');
		var node = $(selector.jquery,data);
		if (node.length>0 || select.substring(0,1)=="."){
			var nodeid = $(node).attr("id");
			//----------------------------
			var url = UICom.structure["ui"][nodeid].resource.getView("dashboard_"+nodeid,null,null,true);
			text = "<img src=\""+url+"\">";
		}
	} catch(e){
		text = "<span id='dashboard_"+nodeid+"'>&mdash;</span>";
	}
	//------------------------------
	$("#"+destid).append($(text));
}

//=============================================================================
//=============================================================================
//====================== EUROPASS =============================================
//=============================================================================
//=============================================================================

//==================================
function r_processEuropass(xmlDoc,destid,data)
//==================================
{
	var style = "";
	var attr_help = "";
//	try {
		var selector = r_getSelector('asmUnitStructure.EuropassL','');
		var node = $(selector.jquery,data);
		if (node.length>0 || select.substring(0,1)=="."){
			var nodeid = $(node).attr("id");
			var text = "<table id='europass'></table>";
			$("#"+destid).append($(text));
			var europass_node = UICom.structure["ui"][nodeid];
			//----------------------------
			europass_node.structured_resource.displayView("europass",null,'report',nodeid,null,false);
		}
//	} catch(e){
//		text = "<span id='dashboard_"+nodeid+"'>&mdash;</span>";
//	}
	//------------------------------
}

//==================================
function r_processText(xmlDoc,destid,data,line,is_out_csv)
//==================================
{
	var nodeid = $(data).attr("id");
	var text = $(xmlDoc).text();
	var style = $(xmlDoc).attr("style");
	var ref = $(xmlDoc).attr("ref");
	if (ref!=undefined && ref!="") {
		if (aggregates[ref]==undefined)
			aggregates[ref] = new Array();
		aggregates[ref][aggregates[ref].length] = text;
	}
	//-----------------
	if (is_out_csv!=null && is_out_csv) {
		if (typeof csvseparator == 'undefined') // for backward compatibility
			csvseparator = ";";
		csvline += text + csvseparator;		
	}
	//-----------------
	text = "<span id='"+nodeid+"'>"+text+"</span>";
	$("#"+destid).append($(text));
	$("#"+nodeid,$("#"+destid)).attr("style",style);
}

//==================================
function refresh_report(dashboard_current)
//==================================
{
	$("#"+dashboard_current).html("");
	r_processPortfolio(0,dashboard_infos[dashboard_current].xmlReport,dashboard_current,dashboard_infos[dashboard_current].data,0);
	$('[data-tooltip="true"]').tooltip();
}

//==================================
function r_processJSFunction(xmlDoc,destid,data)
//==================================
{
	var jsfunction = $(xmlDoc).attr("function");
	eval (jsfunction);
}

//==================================
function r_processURL2Unit(xmlDoc,destid,data)
//==================================
{
	var nodeid = $(data).attr("id");
	var targetid = "";
	var text = "";
	var style = $(xmlDoc).attr("style");
	var select = $(xmlDoc).attr("select");
	var selector = r_getSelector(select);
	var node = $(selector.jquery,data);
	if (node.length==0) // try the node itself
		node = $(selector.jquery,data).addBack();
	if (select.substring(0,2)=="..") // node itself
		node = data;
	if (node.length>0 || select.substring(0,1)=="."){
		var nodeid = $(node).attr("id");
		targetid = UICom.structure["ui"][nodeid].getUuid();
		label = UICom.structure["ui"][nodeid].getLabel(null,'none');
	}
	text = "<span id='"+nodeid+"' class='report-url2unit' onclick=\"$('#sidebar_"+targetid+"').click()\">"+label+"</span>";
	$("#"+destid).append($(text));
	$("#"+nodeid).attr("style",style);
}

//==================================
function r_processAggregate(aggregate,destid)
//==================================
{
	var style = $(xmlDoc).attr("style");
	var ref = $(aggregate).attr("ref");
	var type = $(aggregate).attr("type");
	var select = $(aggregate).attr("select");
	var text = "";
	if (type=="sum" && aggregates[select]!=undefined){
		var sum = 0;
		for (var i=0;i<aggregates[select].length;i++){
			if ($.isNumeric(aggregates[select][i]))
				sum += parseFloat(aggregates[select][i]);
		}
		text = sum;
	}
	if (type=="avg" && aggregates[select]!=undefined){
		var sum = 0;
		for (var i=0;i<aggregates[select].length;i++){
			if ($.isNumeric(aggregates[select][i]))
				sum += parseFloat(aggregates[select][i]);
		}
		text = sum/aggregates[select].length;
		if (text.toString().indexOf(".")>-1)
			text = text.toFixed(2);
		
	}
	if (ref!=undefined && ref!="") {
		if (aggregates[ref]==undefined)
			aggregates[ref] = new Array();
		aggregates[ref][aggregates[ref].length] = text;
	}
	if (!$.isNumeric(text))
		text="";
	text = "<span>"+text+"</span>";
	$("#"+destid).append($(text));
	$("#"+destid).attr("style",style);
}
//===============================================================
//===============================================================
//===============================================================
//===============================================================

//==================================
function report_processCode()
//==================================
{
	var model_code = $("#report-model_code").val();
	report_getModelAndProcess(model_code);
}

//==================================
function report_getModelAndPortfolio(model_code,node,destid,g_dashboard_models)
//==================================
{
	var xml_model = "";
	$.ajax({
		type : "GET",
		dataType : "xml",
		url : serverBCK_API+"/portfolios/portfolio/code/"+model_code,
		success : function(data) {
			var nodeid = $("asmRoot",data).attr("id");
			// ---- transform karuta portfolio to report model
			var urlS = serverBCK_API+"/nodes/"+nodeid+"?xsl-file="+karutaname+"/karuta/xsl/karuta2report.xsl&lang="+LANG;
			$.ajax({
				type : "GET",
				dataType : "xml",
				url : urlS,
				success : function(data) {
					g_dashboard_models[model_code] = data;
					try {
						r_processPortfolio(0,data,destid,node,0);
					}
					catch(err) {
						alertHTML("Error in Dashboard : " + err.message);
					}
					$("#wait-window").hide();
					$("#wait-window").modal('hide');
				}
			 });
		}
	});
}

//==================================
function report_getModelAndProcess(model_code,json)
//==================================
{
	$('#wait-window').show();
	$.ajax({
		type : "GET",
		dataType : "xml",
		url : serverBCK_API+"/portfolios/portfolio/code/"+model_code,
		success : function(data) {
			var nodeid = $("asmRoot",data).attr("id");
			// ---- transform karuta portfolio to report model
			var urlS = serverBCK_API+"/nodes/"+nodeid+"?xsl-file="+karutaname+"/karuta/xsl/karuta2report.xsl&lang="+LANG;
			$.ajax({
				type : "GET",
				dataType : "xml",
				url : urlS,
				success : function(data) {
					r_report_process(data,json);
					$("#wait-window").hide();
					$("#wait-window").modal('hide');
				}
			 });
		}
	});
}

//==================================
function xml2PDF(content)
//==================================
{
	$("#wait-window").show(2000,function(){$("#wait-window").hide(1000)});
	var data = $('#'+content).html();
	data = data.replace(/&nbsp;/g, ' ');
	data = data.replace(/<hr>/g, '<hr/>');
	data = data.replace(/<br>/g, '<br/>');
	data = data.replace(/<hr>/g, '<hr/>');
	data = data.replace(/(<img("[^"]*"|[^\/">])*)>/g, "$1/>");
	data = "<!DOCTYPE xsl:stylesheet [<!ENTITY nbsp \"&amp;#160;\">]><div>" + data + "</div>";
	var url = window.location.href;
	var serverURL = url.substring(0,url.indexOf(appliname)-1);
	var urlS =  "../../../"+serverBCK+"/xsl?xsl="+karutaname+"/karuta/xsl/html2fo.xsl&parameters=lang:"+LANG+";url:"+serverURL+"/"+serverBCK+";url-appli:"+serverURL+"/"+appliname+"&format=application/pdf";
	postAndDownload(urlS,data);
}

//==================================
function displayPDFButton()
//==================================
{
	var html = "<h4 class='line'><span class='badge'>3</span></h4><button onclick=\"javascript:xml2PDF('report-pdf')\">PDF</button>";
	$("#report-pdf").html(html);
}

//==================================
function xml2RTF(content)
//==================================
{
	$("#wait-window").show(2000,function(){$("#wait-window").hide(1000)});
	var data = $('#'+content).html();
	data = data.replace(/&nbsp;/g, ' ');
	data = data.replace(/<hr>/g, '<hr/>');
	data = data.replace(/<br>/g, '<br/>');
	data = data.replace(/(<img("[^"]*"|[^\/">])*)>/g, "$1/>");
	data = "<!DOCTYPE xsl:stylesheet [<!ENTITY nbsp \"&amp;#160;\">]><div>" + data + "</div>";
	var url = window.location.href;
	var serverURL = url.substring(0,url.indexOf(appliname)-1);
	var urlS =  "../../../"+serverBCK+"/xsl?xsl="+karutaname+"/karuta/xsl/html2fo.xsl&parameters=lang:"+LANG+";url:"+serverURL+"/"+serverBCK+";url-appli:"+serverURL+"/"+appliname+"&format=application/rtf";
	postAndDownload(urlS,data);
}

//==================================
function displayRTFButton()
//==================================
{
	var html = "<h4 class='line'><span class='badge'>3</span></h4><button onclick=\"javascript:xml2RTF('report-pdf')\">RTF/Word</button>";
	$("#report-pdf").html(html);
}


//==================================
function xml2CSV(content)
//==================================
{
	$("#wait-window").show(2000,function(){$("#wait-window").hide(1000)});
	var data = $('#'+content).html();
	data = data.replace('&nbsp;', ' ');
	data = "<!DOCTYPE xsl:stylesheet [<!ENTITY nbsp \"\">]><div>" + data + "</div>";
	var url =  "../../../"+serverBCK+"/xsl?xsl="+karutaname+"/karuta/xsl/html2csv.xsl&parameters=lang:"+LANG+"&format=application/csv";
	postAndDownload(url,data);
}

//==================================
function displayCSVButton()
//==================================
{
	var html = "<h4 class='line'><span class='badge'>4</span></h4><button onclick=\"javascript:xml2CSV('report-content')\">CSV</button>";
	$("#report-csv").html(html);
}

//==================================
function html2IMG(contentid)
//==================================
{
	var js1 = "javascript:$('#image-window').modal('hide')";
	var footer = "";
	footer += "<button class='btn' onclick=\""+js1+";\">"+karutaStr[LANG]['Close']+"</button>";
	$("#image-window-footer").html($(footer));
	$("#image-window-body").html("");
	$("#image-window").modal('show');
	var svgnode = $("svg",document.getElementById(contentid));
	if(svgnode.length>0) {
		var img = SVGToPNG(svgnode);
		$("#image-window-body").append(img);
	} else {
		var htmlnode = document.getElementById(contentid);
		var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>";
		svg += "<foreignObject width='100%' height='100%'>";
		svg += xml2string(htmlnode);
		svg += "</foreignObject>";
		svg += "</svg>";
//		alert(svg);
		var htmlcanvas = "<canvas id='canvas' width='400' height='400'></canvas>"
/*		$("image-window-body").html(htmlcanvas)
		rasterizeHTML.drawHTML(xml2string(htmlnode),canvas);
		var DOMURL = window.URL || window.webkitURL || window;
		var svgobj = new Blob([svg], {type: 'image/svg+xml'});
		var url = DOMURL.createObjectURL(svgobj);
		var img = document.createElement('img');
		img.src = url;
		document.getElementById("image-window-body").appendChild(img);
*/

		html2canvas(htmlnode).then(function(canvas) {
			var src_img = canvas.toDataURL();
			var img = document.createElement('img');
			img.src = src_img;
			document.getElementById("image-window-body").appendChild(img);
	});

	}
}

//==================================
function register_report(uuid)
//==================================
{
	$("#wait-window").show(2000,function(){$("#wait-window").hide(1000)});
	var node_resource = UICom.structure["ui"][uuid].resource;
	var startday = node_resource.startday_node.text();
	var time = node_resource.time_node.text();
	var freq = node_resource.freq_node.text();
	var comments = node_resource.comments_node[LANGCODE].text();
	var data={code:uuid,portfolioid:g_portfolioid,startday:startday,time:time,freq:freq,comments:comments};
	var url = serverBCK+"/report";
	$.ajax({
		type : "POST",
		url : url,
		data : data,
		dataType: "text",
		success : function(data) {
			alertHTML("OK - rapport inscrit");
		},
		error : function(jqxhr, textStatus, err) {
			alertHTML("Erreur - rapport non inscrit:"+textStatus+"/"+jqxhr.status+"/"+jqxhr.statusText);
		}
	});
}

//==================================
function genDashboardContent(destid,uuid,parent,root_node)
//==================================
{
	var spinning = true;
	var model_code = UICom.structure["ui"][uuid].resource.getView();
	if (model_code.indexOf('/')>-1){
		var parameters = model_code.substring(model_code.indexOf('/')+1).split('/');
		for (var i=0; i<parameters.length;i++){
			variables[parameters[i].substring(0,parameters[i].indexOf(":"))] = parameters[i].substring(parameters[i].indexOf(":")+1);
		}
	model_code = model_code.substring(0,model_code.indexOf("/"));
	}
	if (model_code.indexOf("@local")>-1){
		root_node = parent.node;
		model_code = model_code.substring(0,model_code.indexOf("@local"))+model_code.substring(model_code.indexOf("@local")+6);
	}
	if (model_code.indexOf("@norefresh")>-1){
		refresh = false;
		model_code = removeStr(model_code,"@norefresh");
	}
	if (model_code.indexOf("@nospinning")>-1){
		spinning = false;
		model_code = model_code.substring(0,model_code.indexOf("@nospinning"))+model_code.substring(model_code.indexOf("@nospinning")+11);
	}
	var selfcode = $("code",$("asmRoot>asmResource[xsi_type='nodeRes']",UICom.root.node)).text();
	if (model_code.indexOf('.')<0 && model_code!='self' && model_code!='')  // There is no project, we add the project of the current portfolio
		model_code = selfcode.substring(0,selfcode.indexOf('.')) + "." + model_code;
	try {
		if (g_dashboard_models[model_code]!=null && g_dashboard_models[model_code]!=undefined)
			r_processPortfolio(0,g_dashboard_models[model_code],destid,root_node,0,spinning);
		else
			report_getModelAndPortfolio(model_code,root_node,destid,g_dashboard_models,spinning);
	}
	catch(err) {
		alertHTML("Error in Dashboard : " + err.message);
	}
	if (spinning)
		$("#wait-window").show(1000,function(){sleep(1000);$("#wait-window").hide(1000)});					
};

//=========================================================================
//=========================================================================
//======================= SVG =============================================
//=========================================================================
//=========================================================================

var svgfontname = 'Arial';
var svgfontsize = 16;
var svgcenter = {'x':500,'y':500};
var svgaxislength = 500;

function makeSVG(tag, attrs,val) {
	var elt= document.createElementNS('http://www.w3.org/2000/svg', tag);
	for (var k in attrs)
		elt.setAttribute(k, attrs[k]);
	if (val !=null) {
		var textNode = document.createTextNode(val);
		elt.appendChild(textNode);
	}
	return elt;
}

function svgrotate(center, x, y, angle) {
	var radians = (Math.PI / 180) * (0-angle),
	cos = Math.cos(radians),
	sin = Math.sin(radians),
	nx = (cos * (x - center.x)) + (sin * (y - center.y)) + center.x,
	ny = (cos * (y - center.y)) - (sin * (x - center.x)) + center.y;
	return {'x':nx,'y':ny};
}

function getWidthOfText(txt, fontname, fontsize){
	  var c=document.createElement('canvas');
	  var ctx=c.getContext('2d');
	  ctx.font = fontsize + 'px' + fontname;
	  var length = ctx.measureText(txt).width;
	  return length;
}
	
function drawAxis(destid,label,fontname,fontsize,angle,center,axislength){
	//-----------------
	var line = makeSVG('line',{'x1':center.x,'y1':center.y,'x2':center.x-axislength,'y2':center.y,'transform':"rotate("+angle+" "+center.x+" "+center.y+")",'stroke':'black','stroke-width': 2});
	document.getElementById(destid).appendChild(line);
	//-----------------
	var x = center.x-axislength;
	var y = center.y - (fontsize/2);
	if (angle>90 && angle<=270) {
		var l =  getWidthOfText(label, fontname, fontsize);
		x=center.x+axislength-l*1.6;
		angle = angle-180;
	}
	var text = makeSVG('text',{'x':x,'y':y,'transform':"rotate("+angle+" "+center.x+" "+center.y+")",'font-size':fontsize,'font-family':fontname},label);
	document.getElementById(destid).appendChild(text);
	//-----------------
}

function drawValue(destid,value,angle,center,cssclass){
	var point = svgrotate(center, svgaxislength-value, center.y, angle);
	var line = makeSVG('line',{'x1':point.x,'y1':point.y,'x2':point.x,'y2':point.y,'class':cssclass});
	document.getElementById(destid).appendChild(line);
}

function drawGraduationLine(destid,no,min,max,angle,center,cssclass){
	var delta = Math.abs(max-min);
	var x = svgaxislength-(svgaxislength/delta*no);
	var line = makeSVG('line',{'x1':x,'y1':center.y-5,'x2':x,'y2':center.y+5,'transform':"rotate("+angle+" "+center.x+" "+center.y+")",'stroke':'black','stroke-width': 1});
	document.getElementById(destid).appendChild(line);
}

function drawGraduationLabel(destid,no,min,max,angle,center,cssclass){
	var delta = Math.abs(max-min);
	var x = svgaxislength-(svgaxislength/delta*no);
	var point = svgrotate(center, x, center.y+20, angle);
	var text = makeSVG('text',{'x':point.x,'y':point.y,'font-size':svgfontsize,'font-family':svgfontname},(max>min)?no+min:min-no);
	document.getElementById(destid).appendChild(text);
}


function drawLine(destid,value1,angle1,value2,angle2,center,cssclass){
	var point1 = svgrotate(center, svgaxislength-value1, center.y, angle1);
	var point2 = svgrotate(center, svgaxislength-value2, center.y, angle2);
	var line = makeSVG('line',{'x1':point1.x,'y1':point1.y,'x2':point2.x,'y2':point2.y,'class':cssclass});
	document.getElementById(destid).appendChild(line);
}

//==================================
function r_processWebTitle(xmlDoc,destid,data)
//==================================
{
	var select = $(xmlDoc).attr("select");
	if (select!=undefined) {
		var selector = r_getSelector(select,null);
		var nodes = $(selector.jquery,data).addBack(selector.jquery).filter(selector.filter1);
		nodes = eval("nodes"+selector.filter2);
		var text = 'Title';
		for (var i=0; i<nodes.length;i++){
			//---------------------------
			var nodeid = $(nodes[i]).attr("id");
			if (selector.type=='resource') {
				text = UICom.structure["ui"][nodeid].resource.getView("svg_"+nodeid,'none');
			}
			if (selector.type=='resource code') {
				text = UICom.structure["ui"][nodeid].resource.getCode();
			}
			if (selector.type=='resource value') {
				text = UICom.structure["ui"][nodeid].resource.getValue("svg_value_"+nodeid);
			}
			if (selector.type=='resource label') {
				text = UICom.structure["ui"][nodeid].resource.getLabel(null,'none');
			}
			if (selector.type=='node label') {
				text = UICom.structure["ui"][nodeid].getLabel(null,'none');
			}
			if (selector.type=='node value') {
				text = UICom.structure["ui"][nodeid].getValue();
			}
			if (selector.type=='node context') {
				text = UICom.structure["ui"][nodeid].getContext("svg_context_"+nodeid);
			}
		};
//		var l = getWidthOfText(text, svgfontname, svgfontsize*2);
//		var x = svgaxislength*2-l*3.2;
		var x = 10;
		var svgtext = makeSVG('text',{'x':x,'y':40,'font-size':svgfontsize*2,'font-family':svgfontname},text);
		document.getElementById(destid).appendChild(svgtext);
	}
}
//==================================
function r_processWebAxis(xmlDoc,destid,data)
//==================================
{
	var select = $(xmlDoc).attr("select");
	if (select!=undefined) {
		var selector = r_getSelector(select,null);
		var nodes = $(selector.jquery,data).filter(selector.filter1);
		nodes = eval("nodes"+selector.filter2);
		var angle = 360 / nodes.length;
		for (var i=0; i<nodes.length;i++){
			//---------------------------
			var text = "";
			var nodeid = $(nodes[i]).attr("id");
			if (selector.type=='resource') {
				text = UICom.structure["ui"][nodeid].resource.getView("svg_"+nodeid,'none');
			}
			if (selector.type=='resource code') {
				text = UICom.structure["ui"][nodeid].resource.getCode();
			}
			if (selector.type=='resource value') {
				text = UICom.structure["ui"][nodeid].resource.getValue("svg_value_"+nodeid);
			}
			if (selector.type=='resource label') {
				text = UICom.structure["ui"][nodeid].resource.getLabel(null,'none');
			}
			if (selector.type=='node label') {
				text = UICom.structure["ui"][nodeid].getLabel(null,'none');
			}
			if (selector.type=='node value') {
				text = UICom.structure["ui"][nodeid].getValue();
			}
			if (selector.type=='node context') {
				text = UICom.structure["ui"][nodeid].getContext("svg_context_"+nodeid,'none');
			}
			drawAxis(destid,text,svgfontname,svgfontsize,angle*i,svgcenter,svgaxislength);
		};
	}
}

//==================================
function r_processWebLine(xmlDoc,destid,data,no)
//==================================
{
	var select = $(xmlDoc).attr("select");
	var legendselect = $(xmlDoc).attr("legendselect");
	var test = $(xmlDoc).attr("test");
	var min = parseInt($(xmlDoc).attr("min"));
	var max = parseInt($(xmlDoc).attr("max"));
	var pos = $(xmlDoc).attr("pos");
	if (pos==undefined)
		pos = 0;
	if (pos > no)
		no = pos;
	var html = "";
	if (select!=undefined) {
		var selector = r_getSelector(select,null);
		var nodes = $(selector.jquery,data).filter(selector.filter1);
		nodes = eval("nodes"+selector.filter2);
		var angle = 360 / nodes.length;
		var points = [];
		for (var i=0; i<nodes.length;i++){
			//---------------------------
			var nodeid = $(nodes[i]).attr("id");
			if (selector.type=='resource') {
				text = UICom.structure["ui"][nodeid].resource.getView("svg_"+nodeid,'none');
			}
			if (selector.type=='resource code') {
				text = UICom.structure["ui"][nodeid].resource.getCode();
			}
			if (selector.type=='resource value') {
				text = UICom.structure["ui"][nodeid].resource.getValue("svg_value_"+nodeid);
			}
			if (selector.type=='resource label') {
				text = UICom.structure["ui"][nodeid].resource.getLabel(null,'none');
			}
			if (selector.type=='node label') {
				text = UICom.structure["ui"][nodeid].getLabel(null,'none');
			}
			if (selector.type=='node value') {
				text = UICom.structure["ui"][nodeid].getValue();
			}
			if (selector.type=='node context') {
				text = UICom.structure["ui"][nodeid].getContext("svg_context_"+nodeid,'none');
			}
			if (text.length>0)
				points[points.length] = {'value': ((text - min)/(max-min))*svgaxislength, 'angle':angle*i};
			else
				points[points.length] = {'value': null, 'angle':angle*i};
		};
		for (var i=0; i<nodes.length;i++){
			if (points[i].value!=null)
				drawValue(destid,points[i].value,points[i].angle,svgcenter,'svg-web-value'+no);
			if (no==0 && pos==0){
				for (var j=0;j<=Math.abs(max-min);j++) {
					if (j>0)
						drawGraduationLine(destid,j,min,max,angle*i,svgcenter,'svg-web-line'+no);
					if (i==0)
						drawGraduationLabel(destid,j,min,max,angle*i,svgcenter,'svg-web-line'+no);
				}
			}
			if (i>0 && points[i-1].value!=null && points[i].value!=null)
				drawLine(destid,points[i-1].value,points[i-1].angle,points[i].value,points[i].angle,svgcenter,'svg-web-line'+no);
		}
		if (points[i-1].value!=null && points[0].value!=null)
			drawLine(destid,points[i-1].value,points[i-1].angle,points[0].value,points[0].angle,svgcenter,'svg-web-line'+no);
		// draw legend
		if (legendselect!=undefined) {
			var selector = r_getSelector(legendselect,null);
			var nodes = $(selector.jquery,data).filter(selector.filter1);
			nodes = eval("nodes"+selector.filter2);
			var text = 'legend';
			for (var i=0; i<nodes.length;i++){
				//---------------------------
				var nodeid = $(nodes[i]).attr("id");
				if (selector.type=='resource') {
					text = UICom.structure["ui"][nodeid].resource.getView("svg_"+nodeid,'none');
				}
				if (selector.type=='resource code') {
					text = UICom.structure["ui"][nodeid].resource.getCode();
				}
				if (selector.type=='resource value') {
					text = UICom.structure["ui"][nodeid].resource.getValue("svg_value_"+nodeid);
				}
				if (selector.type=='resource label') {
					text = UICom.structure["ui"][nodeid].resource.getLabel(null,'none');
				}
				if (selector.type=='node label') {
					text = UICom.structure["ui"][nodeid].getLabel(null,'none');
				}
				if (selector.type=='node value') {
					text = UICom.structure["ui"][nodeid].getValue();
				}
				if (selector.type=='node context') {
					text = UICom.structure["ui"][nodeid].getContext("svg_context_"+nodeid,'none');
				}
			};
			var line = makeSVG('line',{'x1':10,'y1':975-20*no,'x2':10,'y2':975-20*no,'class':'svg-web-value'+no});
//			var line = makeSVG('line',{'x1':10,'y1':25+20*no,'x2':10,'y2':25+20*no,'class':'svg-web-value'+no});
			document.getElementById(destid).appendChild(line);
			var svgtext = makeSVG('text',{'x':20,'y':980-20*no,'font-size':svgfontsize,'font-family':svgfontname},text);
//			var svgtext = makeSVG('text',{'x':20,'y':30+20*no,'font-size':svgfontsize,'font-family':svgfontname},text);
			document.getElementById(destid).appendChild(svgtext);
		}

	}
}