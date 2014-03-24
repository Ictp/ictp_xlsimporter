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
## along with Indico. If not, see <http://www.gnu.org/licenses/>.

import indico.ext.importer.ictp_xlsimporter.handlers as handlers
from indico.web.flask.wrappers import IndicoBlueprint


#blueprint = IndicoBlueprint('importer-ictp_xlsimporter', __name__, url_prefix='/ictp_xlsimporter')
blueprint = IndicoBlueprint('importer-ictp_xlsimporter', __name__)
blueprint.add_url_rule('/event/<confId>/manage/timetable/upload', 'timetableUpload', handlers.RHTimetableUpload, methods=('POST',))
blueprint.add_url_rule('/ictp_xlsimporter/<path:filepath>', 'htdocs', handlers.RHImporterHtdocs)
