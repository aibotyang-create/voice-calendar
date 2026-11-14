export async function deleteCalendarEvent(event,{request,confirm}){
 if(!event?.id)throw Error('삭제할 일정을 찾지 못했어요. 새로고침 후 다시 시도해주세요.');
 const title=event.summary||'이름 없는 일정',date=event.start?.dateTime||event.start?.date||'';
 if(!await confirm('Google 캘린더에서 “'+title+'” 일정을 삭제할까요?\n'+date.slice(0,16).replace('T',' ')+(event.recurringEventId?'\n반복 일정 중 선택한 이 일정만 삭제합니다.':'')))return false;
 const response=await request('/'+encodeURIComponent(event.id),{method:'DELETE'});
 if(!response.ok&&![404,410].includes(response.status))throw Error(response.status===403?'이 일정을 삭제할 권한이 없어요.':'Google 캘린더에서 삭제하지 못했어요. 다시 시도해주세요.');
 return true;
}
