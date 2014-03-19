# -*- coding: utf-8 -*-
##
## $id$
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
import os
import zope.interface
from webassets import Bundle

# legacy imports
from MaKaC.plugins.base import Observable
from indico.core.config import Config
from MaKaC.common.info import HelperMaKaCInfo

# indico imports
from indico.web.assets import PluginEnvironment
from indico.core.extpoint import Component
from indico.core.extpoint.events import ITimetableContributor
from indico.core.extpoint.plugins import IPluginDocumentationContributor
from indico.ext.importer import ictp_xlsimporter
from indico.ext.importer.pages import WPluginHelp


class ImporterContributor(Component, Observable):
    """
    Adds interface extension to event's timetable modification websites.
    """

    zope.interface.implements(ITimetableContributor)

    @classmethod
    def includeTimetableJSFiles(cls, obj, params={}):
        """
        Includes additional javascript file.
        """
        info = HelperMaKaCInfo.getMaKaCInfoInstance()
        asset_env = PluginEnvironment('ictp_xlsimporter', os.path.dirname(__file__), 'ictp_xlsimporter')
        asset_env.debug = info.isDebugActive()
        asset_env.register('ictp_xlsimporter_js', Bundle('js/ictp_xlsimporter.js',
                                                 filters='rjsmin',
                                                 output="ictp_xlsimporter%(version)s.min.js"))
        params['paths'].extend(asset_env['ictp_xlsimporter_js'].urls())

    @classmethod
    def includeTimetableCSSFiles(cls, obj, params={}):
        """
        Includes additional Css files.
        """
        info = HelperMaKaCInfo.getMaKaCInfoInstance()
        asset_env = PluginEnvironment('ictp_xlsimporter', os.path.dirname(__file__), 'ictp_xlsimporter')
        asset_env.debug = info.isDebugActive()
        asset_env.register('ictp_xlsimporter_css', Bundle('css/ictp_xlsimporter.css',
                                                  filters='cssmin',
                                                  output="ictp_xlsimporter__%(version)s.min.css"))
        params['paths'].extend(asset_env['ictp_xlsimporter_css'].urls())

    @classmethod
    def customTimetableLinks(cls, obj, params={}):
        """
        Inserts an "Import" link in a timetable header.
        """
        params.update({"ImportXLS" : "createIctpImporterDialog"})


class PluginDocumentationContributor(Component):

    zope.interface.implements(IPluginDocumentationContributor)

    def providePluginDocumentation(self, obj):
        return