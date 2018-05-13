package ar.edu.itba.ss.g6.tp.tp5;

import org.kohsuke.args4j.CmdLineException;
import org.kohsuke.args4j.CmdLineParser;
import org.kohsuke.args4j.Option;

import java.io.File;
import java.nio.file.Path;

public class CommandLineOptions {
    private boolean errorFree;



    @Option(name = "-i", aliases = { "--in" }, required = false, forbids = {"-g"},
     usage = "input file for the particles")
    private Path inFile;

    @Option(name = "-o", aliases = { "--out" }, required = true,
     usage = "output file for the particles")
    private Path outFile;

    @Option(name = "-g", aliases = { "--generate" }, required = false, forbids = {"-s"},
     usage = "input file for the particles")
    private boolean generate;

    @Option(name = "-s", aliases = { "--simulate" }, required = false, forbids = {"-g"},
     usage = "input file for the particles")
    private boolean simulate;

    @Option(name = "-l", aliases = {"--length", "-L"}, usage = "The height of the container")
    private double lenght = 10;

    @Option(name = "-d", aliases = {"--aperture", "-D"}, usage = "The diameter of the aperture in the base")
    private double aperture = 0.25;

    @Option(name = "-w", aliases = {"-W", "--width"}, usage = "The width of the container")
    private double width = 5;

    @Option(name = "-p", aliases = {"--particles", "-P"}, usage = "The number of particles to generate", depends = {"-g"})
    private int particles = 100;

    @Option(name = "-r", aliases = {"--minRadius"}, depends = {"-g"})
    private double minRadius = 0.02;

    @Option(name = "-R", aliases = {"--maxRadius"}, depends = {"-g"})
    private double maxRadius = 0.03;

    @Option(name = "--ect", usage = "elastic constant t", depends = {"-s"})
    private double elasticConstantT = 2;

    @Option(name = "--ecn", usage = "elastic constant n", depends = {"-s"})
    private double elasticConstantN = 10;

    @Option(name = "-m", aliases = {"--mass", "-M"}, usage = "The mass of the particles", depends = {"-s"})
    private double particleMass = 0.01;

    @Option(name = "-t", aliases = {"--time"}, required = false,
     usage = "simulation duration")
    private double duration = 10;

    @Option(name = "-ts", aliases = { "--time-step" }, required = false,
     usage = "time step for simulation")
    private double timeStep = .001;

    @Option(name = "-f", aliases = { "--fps" }, required = false,
     usage = "frames per second")
    private double fps = 30;


    public CommandLineOptions(String... args) {
        CmdLineParser parser = new CmdLineParser(this);
        try {
            parser.parseArgument(args);

            errorFree = true;
        } catch (CmdLineException e) {
            System.err.println(e.getMessage());
            parser.printUsage(System.err);
        }
    }


    public boolean isErrorFree() {
        return errorFree;
    }

    public Path getInFile() {
        return inFile;
    }

    public Path getOutFile() {
        return outFile;
    }

    public boolean isGenerate() {
        return generate;
    }

    public double getDuration() {
        return duration;
    }

    public double getTimeStep() {
        return timeStep;
    }

    public boolean isSimulate() {
        return simulate;
    }

    public double getLenght() {
        return lenght;
    }

    public double getAperture() {
        return aperture;
    }

    public double getWidth() {
        return width;
    }

    public int getParticles() {
        return particles;
    }

    public double getMinRadius() {
        return minRadius;
    }

    public double getMaxRadius() {
        return maxRadius;
    }

    public double getElasticConstantT() {
        return elasticConstantT;
    }

    public double getElasticConstantN() {
        return elasticConstantN;
    }

    public double getParticleMass() {
        return particleMass;
    }

    public double getFps() {
        return fps;
    }
}