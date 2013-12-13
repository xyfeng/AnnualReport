loadjscssfile("https://fonts.googleapis.com/css?family=Lekton|Open+Sans|Open+Sans+Condensed:300", "css");
loadjscssfile("https://dl.dropboxusercontent.com/u/11819416/frog/annualreport.css", "css");

var name = document.getElementsByClassName('name')[0].childNodes[1].innerHTML.replace(/^\s+|\s+$/g,"").toUpperCase();
var list = [];
// var list = [{
// 	"name":"PROJECT NAME",
// 	"hours":130,
// 	"planned":120
// }];

var links = [];
var currLinkCount = 0;
var totalPageCount = 0;
var currYear = 2013;
var startPage = 1;
var pageCount = 6;

findPages();
showOverlay();

//get date and time
function findPages()
{
	var now = new Date();
	var reportDate = new Date(currYear,0,0);
	var diffInDays = (now.getTime() - reportDate.getTime())/1000/60/60/24;
	startPage = Math.max(parseInt((diffInDays - 365 - 14)/7/12) + 1, 1);
	if (diffInDays < 365) {
		pageCount = parseInt(diffInDays/7/12 + 1);
	}
	// console.log('start page: ' + startPage);
	// console.log('page count: ' + pageCount);
}

//hover effect
function addHover()
{
	$('.ar-pro-hours').hover(
		function() {
			// console.log('in');
			var hours = parseInt($(this).data('hours'));
			var days = (hours/8.0).toFixed(1);
			$(this).html(days+'<span>days</span>');
		}, function() {
			var hours = parseInt($(this).data('hours'));
			$(this).html(hours+'<span>hrs</span>');
			// console.log('out');
		}
	);
}
//download
function loadContent()
{
	// downloadFromLink('https://planner.frogdesign.com/timesheets/103542/edit');
	$('#ar_loader').hide();

	var projects = $('#ar_projects');
	for(i in list)
	{
		var one = $('<div class="ar-project"></div>');
		$('<div class="ar-pro-name">'+list[i]['name'].toUpperCase()+'</div>').appendTo(one);
		$('<div class="ar-pro-hours" data-hours="'+list[i]['hours']+'">'+list[i]['hours']+'<span>hrs</span></div>').appendTo(one);
		if(list[i]['planned'] > 0)
		{
			$('<div class="ar-pro-planned">'+list[i]['planned']+' HOURS PLANNED</div>').appendTo(one);
		}
		one.appendTo(projects);
	}
	$('#ar_page').fadeIn();
	addHover();
}

function getLinksFromPage(pageNumber)
{
	console.log('get links from page ' + pageNumber);
	var url = 'https://planner.frogdesign.com/timesheets?page=' + pageNumber;
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
    request.onreadystatechange = pageRequestResponse;
	request.send();
}
function pageRequestResponse(e)
{
    if (this.readyState == 4)
    {
        if (this.status == 200)
        {
			var html = $(this.responseText);
			var tableRows = html.find('.timesheet_list.table_list tbody tr.timesheet_index_row');
			for(var t=0; t < tableRows.length; t++)
			{
				var currRow = tableRows.eq(t);
				var dateStr = currRow.children().eq(1).text().replace(/^\s+|\s+$/g,"");
				var itemYear = parseInt(dateStr.substr(0,4));
				var itemMon = parseInt(dateStr.split('-')[1]);
				var itemDay = parseInt(dateStr.split('-')[2]);
				if ((itemYear == currYear) || (itemYear == currYear - 1 && itemMon == 12 && itemDay > 26) ){
					var timesheetURL = currRow.attr('id').replace('timesheet_', 'https://planner.frogdesign.com/timesheets/') + '/edit';
					links.push(timesheetURL);
					console.log(timesheetURL);
				};
			}
			totalPageCount ++;
			if (totalPageCount == pageCount) {
				for(var l = 0; l < links.length; l ++)
				{
					downloadFromLink(links[l]);
				}
			};
        }
		else{
			console.log('error: ' + url);
		}
    }
}

function downloadFromLink(link)
{
	console.log('downloading timesheet: ' + link);
	var request = new XMLHttpRequest();
	request.open('GET', link, true);
    request.onreadystatechange = linkRequestResponse;
	request.send();
}

function linkRequestResponse(e)
{
    if (this.readyState == 4)
    {
        if (this.status == 200)
        {
			var html = $(this.responseText);
			var dateStr = html.find('#timesheet_start_on').val();
			var itemYear = parseInt(dateStr.substr(0,4));
			var itemMon = parseInt(dateStr.split('-')[1]);
			var itemDay = parseInt(dateStr.split('-')[2]);
			var startDay = 9;
			var endDay = 15;
			if (itemYear == currYear - 1) {	//trim beginning
				startDay += (31 - itemDay);
			}
			if (itemYear == currYear && itemMon == 12 && itemDay > 26) { //trim end
				endDay -= (itemDay - 26 + 2);
			}
			if (startDay > endDay) {
				return;
			};
			// console.log('time sheet week: ' + dateStr);
			// console.log('start day: ' + startDay);
			// console.log('end day: ' + endDay);

			var tableRows = html.find('.assignment_row.generated_assignment.fields');
			for(var t = 0; t < tableRows.length; t++)
			{
				var projectTitle = '';
				var currRow = tableRows.eq(t);
				var projectCode = currRow.children().eq(1).find(':selected').text();
				// console.log('code: ' + projectCode);
				var projectClient = currRow.children().eq(2).find('input').val();
				// console.log('client: ' + projectClient);
				var projectName = currRow.children().eq(3).find('input').val();
				// console.log('name: ' + projectName);
				var projectPlanned = parseInt(currRow.children().eq(8).find('input').val()) || 0;
				// console.log('planned: ' + projectPlanned);
				var projectHours = 0;
				for(var s = startDay; s <= endDay; s++)
				{
					projectHours += parseInt(currRow.children().eq(s).find('input').val()) || 0;
				}
				// console.log('hours: ' + projectHours);
				if (projectCode.indexOf('0800') != -1) {
					if (projectClient === '' && projectName === '') {
						projectTitle = 'UNTITLED';
					}
					else if(projectClient === '' && projectName !== '') {
						projectTitle = projectName.toUpperCase();
					}
					else if(projectClient !== '' && projectName === '') {
						projectTitle = projectClient.toUpperCase();
					}
					else {
						projectTitle = (projectClient + ' – ' + projectName).toUpperCase();	
					}
				}
				else{
					projectTitle = projectCode.substr(7,projectCode.length-7).toUpperCase();
				}
				var FOUND = false;
				for(i in list)
				{
					if(list[i]['name'] === projectTitle)
					{
						FOUND = true;
						list[i]['hours'] += projectHours;
						list[i]['planned'] += projectPlanned;
						break;
					}
				}
				if (!FOUND) {
					var newProject = {}
					newProject['name'] = projectTitle;
					newProject['hours'] = projectHours;
					newProject['planned'] = projectPlanned;
					list.push(newProject);
				};
			}
		}
		else{
			console.log('error: ' + link);
		}
		currLinkCount ++;
		if (currLinkCount == links.length) {
			loadContent();
		};
	}
}

//overlay
$('#ar_close').click(function(){
	closeOverlay();
});

function showOverlay()
{
	$('#ar_overlay').remove();

	var docWidth = $(document).width();
	var docHeight = $(document).height();
	$('body').append('<div id="ar_overlay"><div id="ar_content"><img id="ar_loader" src="https://dl.dropboxusercontent.com/u/11819416/frog/loader.gif" /><div id="ar_page"><div class="ar-header">2013 FROG ANNUAL REPORT</div><div class="ar-title">'+name+'</div><div id="ar_projects"></div><div id="ar_credits"><p>Loader by <a href="http://www.behance.net/gallery/CCF-2013/11412425" target="_blank">Valentin Peslerbe</a></p><p>Inspired by <a href="http://feltron.com/" target="_blank">The Feltron Annual Report</a></p></div></div></div><button id="ar_close">╳</button></div>');
	$('#ar_overlay').width(0).height(docHeight).animate({
		width:docWidth,
	}, 600, function(){
		$('#ar_loader').fadeIn();
		// loadContent();
		for(var i = startPage; i < startPage + pageCount; i ++)
		{
			getLinksFromPage(i);
		}
	});
}

function closeOverlay()
{
	$('#ar_content').css({display:'none'});	
	$('#ar_close').css({display:'none'});	
	$('#ar_overlay').animate({
		width:0,
	}, 400, function(){
		$('#ar_overlay').remove();
		removejscssfile('https://dl.dropboxusercontent.com/u/11819416/frog/annualreport.js','js');
	});
}

//css js loader
function loadjscssfile(filename, filetype){
	removejscssfile(filename,filetype);
	if (filetype=="js"){ 
		var fileref=document.createElement('script')
		fileref.setAttribute("type","text/javascript")
		fileref.setAttribute("src", filename)
	}
	else if (filetype=="css"){
		var fileref=document.createElement("link")
		fileref.setAttribute("rel", "stylesheet")
		fileref.setAttribute("type", "text/css")
		fileref.setAttribute("href", filename)
	}
	if (typeof fileref!="undefined")
	{
		document.getElementsByTagName("head")[0].appendChild(fileref)
	}
}
 
function removejscssfile(filename, filetype){
	var targetelement= "none";
	if(filetype=="js")
	{
		targetelement = "script";
	}else if(filetype=="css"){
	
		targetelement = "link";
	}
	
	var targetattr = "none";
	if(filetype=="js")
	{
		targetattr = "src";
	}else if(filetype=="css"){
	
		targetattr = "href";
	}
	
	var allsuspects=document.getElementsByTagName(targetelement)
	
	for (var i=allsuspects.length; i>=0; i--){
 		if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1)
 		{
   			allsuspects[i].parentNode.removeChild(allsuspects[i])
   		}
	 }
}