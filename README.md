# feedProxy

feedProxy is a lightweight proxy server designed to make modern web content accessible on retro computers from the late 1980s/1990s. It optimizes web pages for machines running DOS-era operating systems with limited processing power, memory, and display capabilities. The core feature of feedProxy is its ability to utilize RSS feeds to replace the index pages of blogs and news sites, resulting in a clean and resource-efficient display that even very low-powered systems can handle.

## Features

- **RSS Feed Integration**: Automatically fetches and parses RSS feeds to generate simplified index pages for blogs, news sites, and other complex websites.
- **Minimalist HTML Output**: Converts modern web content into basic HTML, compatible with older web browsers and low-resolution screens.
- **Resource Efficiency**: Reduces resource usage by eliminating non-essential elements like JavaScript, CSS, and large images.
- **Legacy System Compatibility**: Specifically designed to work on retro hardware, including systems with limited CPU, memory, and graphical capabilities.

## Target Platforms

feedProxy is particularly suited for use with [**PC/GEOS Ensemble**](https://github.com/bluewaysw/pcgeos) and **Breadbox Ensemble**: graphical operating environments for DOS-based systems that require lightweight and efficient web solutions.

## Installation

1. Clone the repository:

   `git clone https://github.com/HubertHuckevoll/feedProxy.git`

2. Navigate to the project directory:

   `cd feedProxy`

3. Install the required Node.js dependencies:

   `npm install`

4. Make the startup scripts executable:

   `chmod +x start stop`

## Usage

1. Start the proxy server on port 8080 (edit the `start` script to change the port number):

   `./start`

2. Configure your retro computer's web browser to use feedProxy as a proxy server. **feedProxy** will show the IP/Port it's running on when started.

3. Navigate to any supported website, and feedProxy will automatically convert it to a retro-friendly format.

4. To stop the proxy server:

   `./stop`

### Configuration

The configuration file for feedProxy is located at \`./config/prefs.json\`. Modify this file to adjust content processing rules to suit your needs.

## Contributions

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please submit a pull request or open an issue on GitHub.

## Acknowledgments

Special thanks to the FreeGEOS community for their inspiration and support throughout the development of this project. You can explore the FreeGEOS project [here](https://github.com/bluewaysw/pcgeos).
