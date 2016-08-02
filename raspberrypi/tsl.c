// Distributed with a free-will license.
// Use it any way you want, profit or free, provided it fits in the licenses of its associated works.
// TSL45315
// This code is designed to work with the TSL45315_I2CS I2C Mini Module available from ControlEverything.com.
// https://www.controleverything.com/content/Light?sku=TSL45315_I2CS#tabs-0-product_tabset-2

#include <stdio.h>
#include <stdlib.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <fcntl.h>

void main() 
{
	// Create I2C bus
	int file;
	char *bus = "/dev/i2c-1";
	if ((file = open(bus, O_RDWR)) < 0) 
	{
		printf("Failed to open the bus. \n");
		exit(1);
	}
	// Get I2C device, TSL45315 I2C address is 0x29(41)
	ioctl(file, I2C_SLAVE, 0x29);

	// Select control register(0x80)
	// Normal operation(0x03)
	char config[2] = {0};
	config[0] = 0x80;
	config[1] = 0x03;
	write(file, config, 2);

	// Select configuration register(0x81)
	// Multiplier 1x, Tint : 400ms(0x00)
	config[0] = 0x81;
	// use Multiplier of 4 => Tint: 100ms(0x10)
	config[1] = 0x02;
	write(file, config, 2);
	
	// Read 2 bytes of data from register(0x84)
	// luminance lsb, luminance msb
	char reg[1] = {0x84};
	write(file, reg, 1);
	char data[2] = {0x05};
	if(read(file, data, 2) != 2)
	{
		printf("Erorr : Input/output Erorr \n");
	}
	else
	{
		// Convert the data
		//float luminance = data[1] * 256 + data[0];
		// multiplier of 4
		float luminance = 4 * ((data[1] << 8) | data[0]);
		//float luminance = ((data[1] & 0xFF) * 256) + (data[0] & 0xFF);

		// Output data to screen
		printf("%f", luminance);
	}
}
