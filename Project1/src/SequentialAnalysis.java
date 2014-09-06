import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.TreeMap;


/**
 * 
 */

/**
 * @author Levi Lu
 *
 */
public class SequentialAnalysis {

	/**
	 * @param args
	 * @throws IOException 
	 */
	public static void main(String[] args) {
		/***
		 * initialize input and output files.
		 * usage : ./run.sh <inputFile> [outputFile], output file is optional.
		 * output directory: output/
		 * default : use sampleInput as input file, output/result as output file.
		 */
		String inputFile = "", outputFile = "";
		if (args.length == 1) {
			inputFile = args[0];
			outputFile = "result";
		}
		else if (args.length == 2) {
			inputFile = args[0];
			outputFile = args[1];
		}
		else {
			System.out.println();
			System.out.println("Usage : ./run.sh <inputFile> [outputFile]");
			System.exit(0);
		}
		System.out.println();
		System.out.println("Sequential analysis for \"" + inputFile + "\" starts.");
		System.out.println("Analysing...");
		
		/***
		 * read one line at a time from the file and analyze it.
		 * use accessCount(HashMap) to store raw page access count.
		 * use sortedAccessCount to store the sorted page access count.
		 * 
		 */
		Map<String, Integer> accessCount = 
				new HashMap<String, Integer>();
		ValueComparator comparator = new ValueComparator(accessCount);
		TreeMap<String, Integer> sortedAccessCount = 
				new TreeMap<String, Integer>(comparator);
		
		//input and output stream
		FileInputStream inputStream = null;
		Scanner sc = null;
		
		try {
			inputStream = new FileInputStream("../" + inputFile);
			sc = new Scanner(inputStream, "ASCII");
			String line, suffix, title;
			Integer access;
			String[] tokens;
			int totalCount = 0;
			int lineNum = 0;
			while (sc.hasNextLine()) {
				line = sc.nextLine();
				lineNum ++;
				/***
				 * parse line
				 * <suffix> <title> <access>
				 */
				tokens = line.split(" ");
				suffix = tokens[0];
				title = tokens[1];
				access = Integer.parseInt(tokens[2]);
				totalCount += access;
				
				
				/***
				 * filter records based on the following rules
				 */
				
				//rule 1: Filter out all pages that are not english wikipedia. 
				if (!suffix.equals("en"))
					continue;
				
				//rule 2: Exclude any pages whose title starts with the following strings.
				if (title.matches(
						"^(Media|Special|Talk|" +
						"User|User_talk|" +
						"Project|Project_talk|" +
						"File|File_talk|" +
						"MediaWiki|MediaWiki_talk|" +
						"Template|Template_talk|" +
						"Help|Help_talk|" +
						"Category|Category_talk|" +
						"Portal|Wikipedia|Wikipedia_talk):.*$"
				))
					continue;
				
				//rule 3: Filter out all articles that start with lowercase English characters.
				if ((title.charAt(0) >= 97 && title.charAt(0) <= 122))
					continue;
				
				//rule 4: Exclude any article that ends with the following extensions.
				if (
						title.endsWith(".jpg") ||
						title.endsWith(".gif") ||
						title.endsWith(".png") ||
						title.endsWith(".JPG") ||
						title.endsWith(".GIF") ||
						title.endsWith(".PNG") ||
						title.endsWith(".txt") ||
						title.endsWith(".ico"))
					continue;
				
				//rule 5:Articles with titles that exactly (case sensitive) match any of the following strings should be excluded.
				if (title.matches("(404_error/|Main_Page|Hypertext_Transfer_Protocol|Favicon.ico|Search)"))
					continue;
				
				//save valid records into the map
				if (accessCount.containsKey(title)) {
					accessCount.put(title, accessCount.get(title) + access);
				}
				else
					accessCount.put(title, access);
			}
			
			//sort the records
			sortedAccessCount.putAll(accessCount);
		
			//write to file
			File file = new File("../output/" + outputFile);  
			FileOutputStream fos = new FileOutputStream(file);  
	        OutputStreamWriter osw = new OutputStreamWriter(fos);          
	        BufferedWriter bw = new BufferedWriter(osw);  
			for (Map.Entry<String, Integer> entry : sortedAccessCount.entrySet())
			{
				bw.write(entry.getKey() + " " + entry.getValue());
				bw.newLine();
			}
			bw.close();
			osw.close();
			fos.close();
			
			System.out.println("Done.");
			System.out.println("Total lines before filtering : " + lineNum);
			System.out.println("Total number of requests made before filtering : " + totalCount);
			System.out.println("After filtering, " + accessCount.size() + " records have been writen to file \"output/" + outputFile + "\".");
			
		} catch (IOException e) {
			System.out.println("input file does not exist!");
			System.exit(-1);
		} finally {
			if (sc != null)
				sc.close();
			try {
				if (inputStream != null)
					inputStream.close();
			} catch (IOException e) {}
		}
	}
}


class ValueComparator implements Comparator<String> {
	Map<String, Integer> base;
	public ValueComparator(Map<String, Integer> base) {
		this.base = base;
	}
	
	public int compare(String s1, String s2) {
		if (base.get(s1) >= base.get(s2))
			return -1;
		return 1;
	}
}

