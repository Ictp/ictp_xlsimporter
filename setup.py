from setuptools import setup, find_packages
if __name__ == '__main__':
    setup(
        name='ictp_xlsimporter',
        version="0.1",
        description="Ictp XLS importer to Contributions",
        author="Giorgio Pieretti",
        packages=find_packages(),
        include_package_data=True,
        install_requires=[],
        package_dir={'ictp_xlsimporter': 'ictp_xlsimporter'},
        entry_points="""
            [indico.ext]
            importer.ictp_xlsimporter = indico.ext.importer.ictp_xlsimporter
        """
    )


# from setuptools import setup
# 
# if __name__ == '__main__':
#     setup(
#         name='ictp_xlsimporter',
#         version="0.2",
#         description="Ictp XLS importer to Contributions",
#         author="Giorgio Pieretti",
#         author_email = "pieretti@ictp.it", 
#         #packages = find_packages(),
#         packages = ['indico', 'indico.ext', 'indico.ext.importer',
#                 'indico.ext.importer.ictp_xlsimporter',
#                 'indico.ext.importer.ictp_xlsimporter.htdocs',
#                 'indico.ext.importer.ictp_xlsimporter.htdocs.css',
#                 'indico.ext.importer.ictp_xlsimporter.htdocs.js'],
#         
#         #package_dir={'ictp_xlsimporter': 'ictp_xlsimporter'},
#         namespace_packages=['indico.ext.importer'],
#         package_data={'indico.ext.importer.ictp_xlsimporter.htdocs.js': ['*.js'],
#                   'indico.ext.importer.ictp_xlsimporter.htdocs.css': ['*.css']},
#         install_requires = ['indico'],
# #        entry_points="""
# #            [indico.ext]
# #            importer.ictp_xlsimporter = indico.ext.importer.ictp_xlsimporter
# #        """
#         entry_points = {'indico.ext': ['importer.ictp_xlsimporter = indico.ext.importer.ictp_xlsimporter']}
# 
#     )
#     
