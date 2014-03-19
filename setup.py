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