# -*- coding: utf-8 -*-
##
##
## This file is part of Indico.
## Copyright (C) 2002 - 2014 European Organization for Nuclear Research (CERN).
##
## Indico is free software; you can redistribute it and/or
## modify it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 3 of the
## License, or (at your option) any later version.
##
## Indico is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
## General Public License for more details.
##
## You should have received a copy of the GNU General Public License
## along with Indico;if not, see <http://www.gnu.org/licenses/>.

# stdlib imports
import pkg_resources

# legacy imports
#from MaKaC.services.implementation.base import ServiceBase
#from MaKaC.plugins.base import PluginsHolder

# indico imports
from indico.web.handlers import RHHtdocs
from MaKaC.webinterface.urlHandlers import URLHandler
from indico.ext.importer.helpers import ImporterHelper
import indico.ext.importer.ictp_xlsimporter
import os
from MaKaC.webinterface.rh.conferenceModif import RHConferenceModifBase
from MaKaC.webinterface.rh.conferenceBase import RHSubmitMaterialBase


from MaKaC.conference import LocalFile
from indico.util import json
import xlrd
import datetime
from MaKaC.services.implementation.base import ServiceBase
#from MaKaC.webinterface.rh.conferenceModif import RHConferenceModifBase
from MaKaC.webinterface.rh.base import RHProtected

import indico.ext.importer


from pytz import timezone
#import transaction

from MaKaC import conference
import MaKaC.common.info as info
from datetime import datetime, timedelta
from MaKaC.schedule import BreakTimeSchEntry


class RHImporterSisImport(RHProtected):
    """Importer for Sis"""



    def _checkParams(self, params):
        self._checkProtection()
        self._params = params

    def process(self, params):
        #print "USER=" + str(self._getUser())
        
        self._checkParams(params)
        return "QUI="+str(params)+ "__USER="+ str(self._getUser())+"__AUTH="+str(self._getAuth())








class RHImporterHtdocs(RHHtdocs):
    """Static file handler for Importer plugin"""

    _local_path = pkg_resources.resource_filename(indico.ext.importer.ictp_xlsimporter.__name__, "htdocs")
    _min_dir = 'importer'





class UHTimetableUpload(URLHandler):
    _endpoint = '.upload'


class RHTimetableUpload(RHSubmitMaterialBase, RHConferenceModifBase):
    _uh = UHTimetableUpload

    def __init__(self, req):
        RHConferenceModifBase.__init__(self, req)
        RHSubmitMaterialBase.__init__(self)

    def _checkParams(self, params):
        RHConferenceModifBase._checkParams(self, params)
        RHSubmitMaterialBase._checkParams(self, params)

 #   def _checkProtection(self):
  #      material, _ = self._getMaterial(forceCreate = False)
  #      if self._target.canUserSubmit(self._aw.getUser()) \
  #          and (not material or material.getReviewingState() < 3):
   #         self._loggedIn = True
        # status = 3 means the paper is under review (submitted but not reviewed)
        # status = 2 means that the author has not yet submitted the material
#        elif not (RCContributionPaperReviewingStaff.hasRights(self, includingContentReviewer=False)
#                  and self._target.getReviewing() and self._target.getReviewing().getReviewingState() in (2, 3)):
#            RHSubmitMaterialBase._checkProtection(self)
#        else:
#            self._loggedIn = True



    
    def readxls(self, fpath):
        workbook = xlrd.open_workbook(fpath)

        if 'agenda_tool' in workbook.sheet_names():
            worksheet = workbook.sheet_by_name('agenda_tool')
            num_rows = worksheet.nrows - 1
            num_cells = worksheet.ncols - 1
            curr_row = -1
            ret = []
            ret_dict = {}
            while curr_row < num_rows:
                curr_row += 1
                row = worksheet.row(curr_row)
                #print 'Row:', curr_row
                curr_cell = -1
                row_data = []
                while curr_cell < num_cells:
                    curr_cell += 1
                    # Cell Types: 0=Empty, 1=Text, 2=Number, 3=Date, 4=Boolean, 5=Error, 6=Blank
                    cell_type = worksheet.cell_type(curr_row, curr_cell)
                    cell_value = worksheet.cell_value(curr_row, curr_cell)
                    if cell_type == 3:
                        cell_value = xlrd.xldate_as_tuple(cell_value, 0)
                    
                    row_data.append(cell_value)
                if row_data[2] in ['TALK','BREAK','SESSION']:
                    dict_row = {
                        'start_date': row_data[0],
                        'event_type': row_data[2],
                        'title': row_data[3],
                        'start_time': row_data[5],
                        'duration': row_data[6],
                        'speaker': row_data[7],
                        'affiliation': row_data[8],
                        'room': row_data[9],
                        'comment': row_data[10]
                    }
                    #print dict_row
                    ret.append(dict_row)
        return {'data':ret}

        
        
    def _process(self):
        try:
            fileEntry = self._files[0]
            resource = LocalFile()
            resource.setFileName(fileEntry["fileName"])
            resource.setFilePath(fileEntry["filePath"])        
            ret = self.readxls(resource.getFilePath())        
            # remove it
            resource.delete()
            return json.dumps({'status': 'OK', 'info': ret}, textarea=True)
        except:
            return json.dumps({'status': 'KO', 'info': []}, textarea=True)
        
        

class DataSave(ServiceBase):
    """
    """
    
    def _checkParams(self):
        ServiceBase._checkParams(self)
        self._data = self._params['data']
        self._confId = self._params['confId']

    def _getAnswer(self):        
        entries = json.loads(self._data)['data']
        #localTimezone = info.HelperMaKaCInfo.getMaKaCInfoInstance().getTimezone()
        localTimezone = 'UTC'
        ch = conference.ConferenceHolder()
        conf = ch.getById(self._confId)
        #conf.enableSessionSlots() 
        ssd = None 
        for entry in entries:
            #print "ENTRY=",entry
            if entry['start_date'] != '':
                sd = entry['start_date']
            dd = entry['duration']
            if dd == '':
                dd = [0,0,0,0,20] # if no DURATION specified, use default = 20 min

            st = entry['start_time']
            if entry['room'] != '':            
                room = conference.CustomRoom()
                room.setName(entry['room'])
    
            if entry['event_type'] == 'SESSION':                
                ssd = timezone(localTimezone).localize(datetime(int(sd[0]), int(sd[1]), int(sd[2]), int(st[3]), int(st[4]) ))  
                
            if entry['event_type'] == 'TALK':
                if st != '':
                    ssd = timezone(localTimezone).localize(datetime(int(sd[0]), int(sd[1]), int(sd[2]), int(st[3]), int(st[4]) )) 
                values = {'title':entry['title'],'description':entry['comment']}
                c1 = conference.Contribution()
                conf.addContribution(c1)
                c1.setStartDate(ssd)
                c1.setDuration(dd[3],dd[4])
                c1.setValues(values)
                if room: c1.setRoom(room)
                
                cp = conference.ContributionParticipation()
                data = {'familyName':entry['speaker'].decode('utf8')}
                cp.setValues(data)
                cp.setAffiliation(entry['affiliation'].decode('utf8'))
                c1._addAuthor( cp )
                c1._primaryAuthors.append( cp )            
                c1.getConference().getAuthorIndex().index(cp)            
                c1.addSpeaker(cp)
                conf.getSchedule().addEntry(c1.getSchEntry())
                ssd = ssd + timedelta(hours=dd[3],minutes=dd[4])   



            if entry['event_type'] == 'BREAK':
                if st != '':
                    ssd = timezone(localTimezone).localize(datetime(int(sd[0]), int(sd[1]), int(sd[2]), int(st[3]), int(st[4]) )) 
                b=BreakTimeSchEntry()
                b.setStartDate(ssd)
                b.setDuration(dd[3],dd[4])
                values = {'title':entry['title'],'description':entry['comment']}
                b.setValues(values)
                if room: b.setRoom(room)
                conf.getSchedule().addEntry(b) 
                ssd = ssd + timedelta(hours=dd[3],minutes=dd[4]) 

        return json.dumps({'status': 'OK', 'info': 'ok'})
        
        #importer = ImporterHelper.getImporter(self._importer)
        #if importer:
        #    return importer.importData(self._query, self._size)
            
            

            
methodMap = {
            "importer.saveData" : DataSave,
             }            